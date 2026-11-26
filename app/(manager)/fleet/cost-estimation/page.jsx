"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import FleetPage, {
  FleetHeader,
  FleetRequestState,
} from "@/components/fleet/FleetPage";
import { useRequest } from "@/hooks/useRequest";
import {
  formatDuration,
  formatKg,
  formatKm,
  formatLabel,
  formatPickup,
  formatZmw,
} from "@/lib/fleet/format";
import {
  acceptMatch,
  loadMatch,
  loadRoute,
  runAssessment,
  skipMatch,
} from "@/lib/fleet/matches";
import { fleetRoutes } from "@/lib/fleet/routes";
import { clearSession } from "@/lib/session";
import "./page.css";

const COST_ROWS = [
  ["fuel_cost", "Fuel"],
  ["driver_cost", "Driver allowance"],
  ["maintenance_cost", "Maintenance"],
  ["toll_cost", "Tolls"],
  ["other_cost", "Other costs"],
];

const POLL_INTERVAL_MS = 3000;

function redirectToLoginOnExpiredSession(router) {
  clearSession();
  router.replace(`${fleetRoutes.login}?message=session-expired`);
}

function PageHeader() {
  return (
    <FleetHeader
      eyebrow="Fleet Manager"
      title="Freight Cost Estimation"
      subtitle="Review the journey, expected operating cost and potential return before making a decision."
    />
  );
}

function EstimateState({ title, children }) {
  return (
    <>
      <PageHeader />
      <div className="fleet-empty">
        <h2>{title}</h2>
        {children}
        <Link href={fleetRoutes.opportunities} className="fleet-button">
          View opportunities
        </Link>
      </div>
    </>
  );
}

function Pending({ children }) {
  return <p className="section-pending">{children}</p>;
}

function Journey({ shipment, savedRoute }) {
  const router = useRouter();
  const loadJourney = useCallback(async () => {
    try {
      return savedRoute ? savedRoute : await loadRoute(shipment);
    } catch (error) {
      if (error?.status === 401) {
        redirectToLoginOnExpiredSession(router);
      }
      throw error;
    }
  }, [router, shipment, savedRoute]);
  const request = useRequest(loadJourney);
  const route = request.status === "ready" ? request.data : null;

  return (
    <section className="journey-section">
      <div className="section-title-row">
        <div>
          <p className="section-label">Journey</p>
          <h2>Route and trip details</h2>
        </div>
      </div>

      <div className="journey-card">
        <div className="journey-route">
          <div>
            <span className="route-dot" />
            <strong>{shipment.origin_address}</strong>
          </div>

          <div className="route-line" />

          <div>
            <span className="route-dot filled" />
            <strong>{shipment.destination_address}</strong>
          </div>
        </div>

        <div className="journey-stats">
          <div>
            <span>Distance</span>
            <strong>{route ? formatKm(route.distance_km) : "—"}</strong>
          </div>

          <div>
            <span>Estimated duration</span>
            <strong>
              {route ? formatDuration(route.duration_minutes) : "—"}
            </strong>
          </div>

          <div>
            <span>Pickup</span>
            <strong>{formatPickup(shipment.pickup_time)}</strong>
          </div>
        </div>

        {request.status === "loading" && <Pending>Calculating route…</Pending>}
        {request.status === "failed" && (
          <Pending>
            {request.error?.message || "Route could not be calculated."}{" "}
            <button
              type="button"
              className="inline-link"
              onClick={request.reload}
            >
              Try again
            </button>
          </Pending>
        )}
      </div>
    </section>
  );
}

function CostCard({ detail }) {
  if (!detail.cost_breakdown) {
    return (
      <Pending>
        Run the assessment to calculate fuel, driver, maintenance, toll and
        other operating costs for this trip.
      </Pending>
    );
  }

  return (
    <div className="cost-rows">
      {COST_ROWS.map(([key, label]) => (
        <div className="profit-row" key={key}>
          <span>{label}</span>
          <strong>{formatZmw(detail.cost_breakdown[key])}</strong>
        </div>
      ))}
      <div className="profit-row is-total">
        <span>Total operating cost</span>
        <strong>{formatZmw(detail.operating_cost_total)}</strong>
      </div>
      <p className="cost-note">
        Calculated from your cost settings and the route. This is the baseline
        input to the AI estimate, not the estimate itself.
      </p>
    </div>
  );
}

function OutlookStatus({ detail }) {
  if (detail.assessment_status === "running") {
    return <Pending>Estimating the total journey cost…</Pending>;
  }
  if (detail.assessment_status === "failed") {
    return (
      <Pending>
        No estimate is available because the assessment did not complete.
      </Pending>
    );
  }
  return (
    <Pending>
      Run the assessment to estimate the total journey cost and margin.
    </Pending>
  );
}

function ProfitCard({ detail }) {
  const completed = detail.assessment_status === "completed";

  return (
    <aside className="profit-card is-primary">
      <p className="section-label">AI freight estimate</p>
      <h2>Trip outlook</h2>

      <div className="profit-row">
        <span>Proposed payment</span>
        <strong>{formatZmw(detail.proposed_payment)}</strong>
      </div>

      {completed ? (
        <>
          <div className="profit-row is-estimate">
            <span>Estimated total cost</span>
            <strong>{formatZmw(detail.estimated_total_cost)}</strong>
          </div>
          <div className="profit-row">
            <span>Estimated margin</span>
            <strong className={`outcome-${detail.outcome}`}>
              {formatZmw(detail.estimated_margin)}
              {detail.margin_percentage !== null &&
                ` (${Number(detail.margin_percentage).toFixed(1)}%)`}
            </strong>
          </div>
          <div className="profit-row">
            <span>Outcome</span>
            <strong className={`outcome-badge outcome-${detail.outcome}`}>
              {formatLabel(detail.outcome)}
            </strong>
          </div>
        </>
      ) : (
        <OutlookStatus detail={detail} />
      )}
    </aside>
  );
}

function runLabel(running, assessed) {
  if (running) return "Running assessment…";
  return assessed ? "Run again" : "Run assessment";
}

function factorStatusLabel(item) {
  if (!item || !item.status) return "Status";

  if (item.status === "not_applicable") return "Not applicable";
  if (item.status === "not_quantified") return "Not quantified";
  if (item.status === "quantified") return "Quantified";

  return String(item.status).replace(/_/g, " ");
}

function assessmentSupportText(assessment) {
  const reasons = (assessment?.major_cost_factors ?? [])
    .map((item) => item.reason)
    .filter(Boolean);

  return reasons[0] || assessment?.summary || "";
}

function AssessmentResult({ detail }) {
  const { assessment } = detail;
  const supportText = assessmentSupportText(assessment);
  const riskItems = assessment.risk_factors ?? [];
  const limitItems = assessment.limitations ?? [];
  const sources = Array.isArray(detail.reference_sources)
    ? detail.reference_sources
    : [];

  return (
    <div className="assessment-body">
      <div className="assessment-highlight">
        <div className="assessment-highlight-icon" aria-hidden="true">
          ✦
        </div>

        <div className="assessment-highlight-copy">
          <p className="assessment-highlight-main">{assessment.summary}</p>
          {supportText && supportText !== assessment.summary && (
            <p className="assessment-highlight-support">{supportText}</p>
          )}
        </div>
      </div>

      <div className="factor-list">
        {assessment.major_cost_factors.map((item, index) => (
          <article key={`${item.factor}-${index}`} className="factor-card">
            <div className="factor-card-copy">
              <div className="factor-card-head">
                <h3>{item.factor}</h3>
                <span className="factor-pill">{factorStatusLabel(item)}</span>
              </div>

              <p>{item.reason}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="assessment-panels">
        <div className="assessment-panel">
          <h3>Risks</h3>
          {riskItems.length ? (
            <ul>
              {riskItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No risk details were attached to this assessment.</p>
          )}
        </div>

        <div className="assessment-panel">
          <h3>Limitations</h3>
          {limitItems.length ? (
            <ul>
              {limitItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No limitations were attached to this assessment.</p>
          )}
        </div>

        <div className="assessment-panel is-evidence">
          <h3>
            {sources.length
              ? "Verified evidence attached"
              : "No verified evidence attached"}
          </h3>
          {sources.length ? (
            <>
              <p>
                {sources.length} evidence source
                {sources.length === 1 ? "" : "s"} attached to this assessment.
              </p>
              <ul>
                {sources.slice(0, 3).map((source, index) => (
                  <li
                    key={source.citation || source.title || source.url || index}
                  >
                    {source.title || source.citation || "Evidence source"}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No verified evidence was attached to this assessment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AssessmentPlaceholder({ running }) {
  return (
    <div className="assessment-empty">
      <div className="sparkle">✦</div>
      <div>
        <h3>{running ? "Assessing this opportunity…" : "No assessment yet"}</h3>
        <p>
          {running
            ? "Your operating costs are ready. ZamLine is reviewing journey risks and validating any additional costs against available evidence."
            : "Run the assessment to review the journey risks, estimated total cost and potential margin."}
        </p>
      </div>
    </div>
  );
}

function Assessment({ detail, running, error, onRun }) {
  const completed = detail.assessment_status === "completed";
  const failed = detail.assessment_status === "failed" && !running;

  return (
    <section className="assessment-section">
      <div className="assessment-header">
        <div>
          <p className="section-label">AI-assisted decision support</p>
          <h2>Journey assessment</h2>
        </div>

        <button
          type="button"
          className="run-button"
          onClick={onRun}
          disabled={running}
        >
          {runLabel(running, Boolean(detail.assessment_status))}
        </button>
      </div>

      {error && <p className="message is-error">{error}</p>}

      {failed && (
        <p className="message is-error">
          Assessment unavailable: {detail.assessment_error}. No estimated cost,
          margin or outcome is shown. Run the assessment again to retry.
        </p>
      )}

      {completed ? (
        <AssessmentResult detail={detail} />
      ) : (
        !failed && <AssessmentPlaceholder running={running} />
      )}
    </section>
  );
}

function Decision({ matchId }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "idle", error: "" });

  async function decide(action, label) {
    setState({ status: "saving", error: "" });
    try {
      await action(matchId);
      setState({ status: "done", label, error: "" });
    } catch (error) {
      if (error?.status === 401) {
        redirectToLoginOnExpiredSession(router);
        return;
      }
      setState({ status: "idle", error: error.message });
    }
  }

  if (state.status === "done") {
    return (
      <footer className="decision-footer">
        <div>
          <strong>Match {state.label}</strong>
          <p>This opportunity has been removed from your open list.</p>
        </div>
        <div className="actions">
          <Link href={fleetRoutes.opportunities} className="fleet-button">
            Back to opportunities
          </Link>
        </div>
      </footer>
    );
  }

  const saving = state.status === "saving";

  return (
    <footer className="decision-footer">
      <div>
        <strong>Ready to make a decision?</strong>
        <p className={state.error ? "decision-error" : undefined}>
          {state.error ||
            "Accept to take this load with the matched truck, or skip it."}
        </p>
      </div>

      <div className="actions">
        <button
          type="button"
          className="skip-button"
          disabled={saving}
          onClick={() => decide(skipMatch, "skipped")}
        >
          Skip
        </button>

        <button
          type="button"
          className="accept-button"
          disabled={saving}
          onClick={() => decide(acceptMatch, "accepted")}
        >
          Accept Match
        </button>
      </div>
    </footer>
  );
}

function Estimate({ match }) {
  const router = useRouter();
  const [detail, setDetail] = useState(match);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const { shipment, truck } = detail;
  const pending = detail.assessment_status === "running";
  const running = starting || pending;

  useEffect(() => {
    if (!pending) return undefined;
    const timer = setTimeout(async () => {
      try {
        setDetail(await loadMatch(detail.match_id));
      } catch (err) {
        if (err?.status === 401) {
          redirectToLoginOnExpiredSession(router);
          return;
        }
        setError(err.message || "The assessment status could not be loaded.");
        setDetail((current) => ({ ...current, assessment_status: null }));
      }
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [pending, detail, router]);

  async function handleRun() {
    setStarting(true);
    setError("");
    try {
      setDetail(await runAssessment(detail.match_id));
    } catch (err) {
      if (err?.status === 401) {
        redirectToLoginOnExpiredSession(router);
        return;
      }
      setError(err.message || "The assessment could not be completed.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <PageHeader />

      <section className="shipment-card">
        <div>
          <p className="section-label">Shipment opportunity</p>
          <h2>{shipment.cargo_type}</h2>

          <div className="route-title">
            <strong>{shipment.origin_address}</strong>
            <span>→</span>
            <strong>{shipment.destination_address}</strong>
          </div>
        </div>

        <div className="shipment-details">
          <div>
            <span>Weight</span>
            <strong>{formatKg(shipment.weight_kg)}</strong>
          </div>

          <div>
            <span>Body type</span>
            <strong>{formatLabel(shipment.required_body_type)}</strong>
          </div>

          <div>
            <span>Matched truck</span>
            <strong>
              {truck.truck_type} · {truck.plate_number}
            </strong>
          </div>

          <div>
            <span>Proposed payment</span>
            <strong className="money">
              {formatZmw(detail.proposed_payment)}
            </strong>
          </div>
        </div>
      </section>

      <Journey shipment={shipment} savedRoute={detail.route} />

      <section className="finance-grid">
        <div>
          <div className="section-title-row">
            <div>
              <p className="section-label">Baseline operating cost</p>
              <h2>Calculated operating cost</h2>
            </div>
            <Link href={fleetRoutes.costSettings} className="settings-link">
              Cost settings
            </Link>
          </div>

          <div className="cost-card">
            <CostCard detail={detail} />
          </div>
        </div>

        <ProfitCard detail={detail} />
      </section>

      <Assessment
        detail={detail}
        running={running}
        error={error}
        onRun={handleRun}
      />

      <Decision matchId={detail.match_id} />
    </>
  );
}

function MatchEstimate({ matchId }) {
  const router = useRouter();
  const request = useRequest(useCallback(() => loadMatch(matchId), [matchId]));
  const status = request.error?.status;

  useEffect(() => {
    if (request.error?.status === 401) {
      redirectToLoginOnExpiredSession(router);
    }
  }, [request.error, router]);

  if (request.status === "failed" && status === 401) {
    return null;
  }

  if (request.status === "failed" && (status === 404 || status === 409)) {
    return (
      <EstimateState title="Opportunity not available">
        <p>{request.error.message}</p>
      </EstimateState>
    );
  }

  if (request.status !== "ready") {
    return (
      <>
        <PageHeader />
        <FleetRequestState
          request={request}
          loadingText="Loading opportunity…"
          unavailableTitle="Opportunity details not available yet"
          unavailableText="The shipment, route and cost details will appear here once they are available."
        />
      </>
    );
  }

  return <Estimate match={request.data} />;
}

function CostEstimation() {
  const matchId = useSearchParams().get("matchId");

  if (!matchId) {
    return (
      <EstimateState title="Choose an opportunity to estimate">
        <p>
          Open any freight opportunity and select View details to see its
          shipment and route.
        </p>
      </EstimateState>
    );
  }

  return <MatchEstimate key={matchId} matchId={matchId} />;
}

export default function CostEstimationPage() {
  return (
    <FleetPage active="cost-estimation">
      <Suspense fallback={null}>
        <CostEstimation />
      </Suspense>
    </FleetPage>
  );
}
