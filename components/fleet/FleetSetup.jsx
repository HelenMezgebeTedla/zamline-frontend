"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as realApi from "../../lib/fleet/api";
import {
  buildSavePlan,
  describeOp,
  emptyDraft,
  formatCapacity,
  runSavePlan,
} from "../../lib/fleet/savePlan";
import { cardForTruckType } from "../../lib/fleet/truckTypes";
import { PlusIcon } from "./FleetIcons";
import FleetRow from "./FleetRow";
import { FleetRowsSkeleton } from "./FleetSkeletons";
import NewTruckRow from "./NewTruckRow";
import TruckDetailsPanel from "./TruckDetailsPanel";
import TruckTypeCards from "./TruckTypeCards";
import "./FleetSetup.css";

async function fetchFleet(api) {
  const [truckList, allocationResult] = await Promise.all([
    api.listTrucks(),
    api.listAllocations().then(
      (list) => ({ list }),
      (error) => ({ error }),
    ),
  ]);
  if (allocationResult.error) {
    if (allocationResult.error.status === 401) throw allocationResult.error;
    return {
      truckList,
      allocatedIds: null,
      allocationError:
        allocationResult.error.message ||
        "Could not load which trucks are on confirmed shipments.",
    };
  }
  const allocatedIds = new Set(
    allocationResult.list
      .filter((a) => a.allocation_status === "allocated")
      .map((a) => a.truck_id),
  );
  return { truckList, allocatedIds, allocationError: "" };
}

export default function FleetSetup({ api = realApi }) {
  const router = useRouter();
  const nextKey = useRef(1);

  const [trucks, setTrucks] = useState([]);
  const [allocated, setAllocated] = useState(new Set());
  const [allocationError, setAllocationError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [edits, setEdits] = useState({});
  const [removed, setRemoved] = useState(new Set());
  const [rowErrors, setRowErrors] = useState({});
  const [openTruckId, setOpenTruckId] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting: saving, errors: formErrors },
  } = useForm({
    defaultValues: {
      trucks: [],
    },
  });

  const {
    fields: dynamicDrafts,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "trucks",
  });

  const watchedTrucks = useWatch({ control, name: "trucks" });
  const watchedTruckDrafts = useMemo(
    () => watchedTrucks || [],
    [watchedTrucks],
  );

  const handleAuthError = useCallback(
    (error) => {
      if (error?.status === 401) {
        realApi.clearToken();
        router.replace("/fleet/login");
        return true;
      }
      return false;
    },
    [router],
  );

  const applyFleet = useCallback(
    ({ truckList, allocatedIds, allocationError: problem }) => {
      setTrucks(truckList);
      setAllocated(allocatedIds);
      setAllocationError(problem || "");
    },
    [],
  );

  useEffect(() => {
    let active = true;
    fetchFleet(api)
      .then((data) => {
        if (active) applyFleet(data);
      })
      .catch((error) => {
        if (active && !handleAuthError(error)) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, applyFleet, handleAuthError]);

  const typeOf = (truck) => cardForTruckType(truck.truck_type).id;

  const selectedCards = useMemo(() => {
    const ids = new Set();
    trucks.forEach((t) => {
      if (!removed.has(t.truck_id)) ids.add(cardForTruckType(t.truck_type).id);
    });
    watchedTruckDrafts.forEach((d) => {
      if (d?.cardId) ids.add(d.cardId);
    });
    hiddenTypes.forEach((id) => ids.delete(id));
    return ids;
  }, [trucks, removed, watchedTruckDrafts, hiddenTypes]);

  const visibleTrucks = trucks.filter((t) => !hiddenTypes.has(typeOf(t)));

  function showType(cardId) {
    setHiddenTypes((set) => {
      if (!set.has(cardId)) return set;
      const next = new Set(set);
      next.delete(cardId);
      return next;
    });
  }

  function addDraft(cardId) {
    if (saving) return;
    const fresh = emptyDraft(cardId);
    append({
      ...fresh,
      key: `new-${nextKey.current++}`,
      cardId: cardId,
    });
    setNotice(null);
  }

  function toggleType(cardId) {
    if (saving) return;
    setNotice(null);
    if (selectedCards.has(cardId)) {
      setHiddenTypes((set) => new Set(set).add(cardId));

      const indicesToRemove = watchedTruckDrafts
        .map((d, index) => (d.cardId === cardId ? index : null))
        .filter((index) => index !== null);

      indicesToRemove.reverse().forEach((index) => remove(index));

      const ids = trucks
        .filter((t) => typeOf(t) === cardId)
        .map((t) => t.truck_id);
      setEdits((all) => {
        const next = { ...all };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setRemoved((set) => new Set([...set].filter((id) => !ids.includes(id))));
      if (ids.includes(openTruckId)) setOpenTruckId(null);
      return;
    }
    showType(cardId);
    const hasTrucks = trucks.some(
      (t) => typeOf(t) === cardId && !removed.has(t.truck_id),
    );
    if (!hasTrucks) addDraft(cardId);
  }

  const dirty =
    Object.keys(edits).length > 0 ||
    removed.size > 0 ||
    dynamicDrafts.length > 0;

  const closeDetails = useCallback(() => setOpenTruckId(null), []);

  const refreshAfterPanel = useCallback(
    async (text) => {
      try {
        applyFleet(await fetchFleet(api));
        if (text) setNotice({ type: "success", text });
      } catch (error) {
        if (!handleAuthError(error)) setLoadError(error.message);
      }
    },
    [api, applyFleet, handleAuthError],
  );

  async function retryAllocations() {
    setRetrying(true);
    try {
      applyFleet(await fetchFleet(api));
    } catch (error) {
      if (!handleAuthError(error)) setLoadError(error.message);
    } finally {
      setRetrying(false);
    }
  }

  function addAnother() {
    if (saving) return;
    const firstFree = [
      "container",
      "curtain-side",
      "box",
      "refrigerated",
      "crane",
      "semi-trailer",
      "rigid",
    ].find((id) => !selectedCards.has(id));
    const cardId = firstFree || "other";
    showType(cardId);
    addDraft(cardId);
  }
  function editTruck(id, change) {
    if (saving) return;
    setEdits((all) => ({ ...all, [id]: { ...all[id], ...change } }));
    setRowErrors((all) => {
      const next = { ...all };
      delete next[id];
      return next;
    });
    setNotice(null);
  }

  function removeTruck(truck) {
    const ok = window.confirm(
      `Retire ${truck.plate_number}? It stays in your records but won't be matched to freight again.`,
    );
    if (!ok) return;
    setRemoved((set) => new Set(set).add(truck.truck_id));
    setNotice(null);
  }

  function restoreTruck(id) {
    setRemoved((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  function cancel() {
    setEdits({});
    setRemoved(new Set());
    remove();
    setRowErrors({});
    setNotice(null);
  }

  const onSaveForm = async (formData) => {
    const currentDrafts = formData.trucks || [];
    const { ops, errors } = buildSavePlan(
      trucks,
      edits,
      removed,
      currentDrafts,
    );

    if (Object.keys(errors).length) {
      setRowErrors(errors);
      setNotice({
        type: "error",
        text: "Fix the highlighted rows, then save again.",
      });
      return;
    }
    if (!ops.length) {
      cancel();
      setNotice({
        type: "success",
        text: "Nothing to save. Your fleet is up to date.",
      });
      return;
    }

    setNotice(null);
    try {
      const results = await runSavePlan(ops, api);
      const authFailure = results.find((r) => !r.ok && r.error?.status === 401);
      if (authFailure) {
        handleAuthError(authFailure.error);
        return;
      }

      const failed = results.filter((r) => !r.ok);
      const failedDraftKeys = new Map(
        failed
          .filter((r) => r.op.kind === "create")
          .map((r) => [r.op.draft.key, r.error.message]),
      );

      setEdits({});
      setRemoved(new Set());
      setRowErrors({});

      const remainingDrafts = currentDrafts.filter((d) =>
        failedDraftKeys.has(d.key),
      );
      remove();
      remainingDrafts.forEach((d) =>
        append({ ...d, error: failedDraftKeys.get(d.key) }),
      );

      applyFleet(await fetchFleet(api));

      if (failed.length) {
        setNotice({
          type: "error",
          text: `${results.length - failed.length} of ${results.length} changes saved. These were refused:`,
          items: failed.map((r) => `${describeOp(r.op)}: ${r.error.message}`),
        });
      } else {
        setNotice({ type: "success", text: "Fleet details saved." });
      }
    } catch (error) {
      if (!handleAuthError(error)) setLoadError(error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSaveForm, () => {
        setNotice({
          type: "error",
          text: "Fix the highlighted fields, then save again.",
        });
      })}
      className="fleet-setup"
    >
      <header className="page-header">
        <p className="eyebrow">Fleet Manager</p>
        <h1>Fleet Setup &amp; Availability</h1>
        <p className="page-header__lead">
          Configure the truck types, carrying capacity and current availability
          ZamLine should use for freight matching.
        </p>
      </header>

      <TruckTypeCards selected={selectedCards} onToggle={toggleType} />

      <section className="fleet-panel" aria-labelledby="your-fleet-title">
        <h2 id="your-fleet-title">Your Fleet</h2>
        <p className="fleet-panel__lead">
          Add the truck and trailer types you operate, their carrying capacity
          and current availability.
        </p>

        <div className="fleet-head" aria-hidden="true">
          <span>Truck type</span>
          <span>Carrying capacity</span>
          <span>Availability</span>
          <span />
        </div>

        {loading ? <FleetRowsSkeleton /> : null}
        {loadError ? (
          <p className="banner banner--error" role="alert">
            {loadError}
          </p>
        ) : null}
        {allocationError ? (
          <p className="banner banner--error" role="alert">
            Could not check which trucks are on confirmed shipments:{" "}
            {allocationError}. Capacity, availability and retiring are turned
            off until this loads.{" "}
            <button
              type="button"
              className="link-button"
              onClick={retryAllocations}
              disabled={retrying}
            >
              {retrying ? "Trying again…" : "Try again"}
            </button>
          </p>
        ) : null}
        {!loading &&
        !loadError &&
        visibleTrucks.length === 0 &&
        dynamicDrafts.length === 0 ? (
          <p className="fleet-empty">
            {trucks.length === 0
              ? "No trucks yet. Tick a truck type above to add one."
              : "Tick a truck type above to see those trucks here."}
          </p>
        ) : null}

        <ul className="fleet-list">
          {visibleTrucks.map((truck) => {
            const id = truck.truck_id;
            const edit = edits[id] || {};
            return (
              <FleetRow
                key={id}
                truck={truck}
                capacity={edit.capacity ?? formatCapacity(truck.capacity_kg)}
                availability={edit.availability ?? truck.availability_status}
                allocated={allocated?.has(id) ?? false}
                allocationUnknown={allocated === null}
                removed={removed.has(id)}
                error={rowErrors[id]}
                onCapacity={(value) => editTruck(id, { capacity: value })}
                onAvailability={(value) =>
                  editTruck(id, { availability: value })
                }
                onRemove={() => removeTruck(truck)}
                onRestore={() => restoreTruck(id)}
                onOpen={() => setOpenTruckId(id)}
              />
            );
          })}
          {dynamicDrafts.map((field, index) => (
            <NewTruckRow
              key={field.id}
              draft={field}
              index={index}
              register={register}
              setValue={setValue}
              isSubmitting={saving}
              onRemove={() => remove(index)}
              error={
                formErrors?.trucks?.[index]?.capacity?.message || field.error
              }
            />
          ))}
        </ul>

        <button
          type="button"
          className="add-row"
          onClick={addAnother}
          disabled={loading}
        >
          <PlusIcon size={16} />
          Add Another Truck Type
        </button>
      </section>

      {notice ? (
        <div
          className={`banner banner--${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <p>{notice.text}</p>
          {notice.items ? (
            <ul>
              {notice.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {openTruckId ? (
        <TruckDetailsPanel
          truckId={openTruckId}
          api={api}
          onClose={closeDetails}
          onAuthError={handleAuthError}
          onChanged={refreshAfterPanel}
        />
      ) : null}

      <div className="actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={cancel}
          disabled={!dirty || saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save Fleet Details"}
        </button>
      </div>
    </form>
  );
}
