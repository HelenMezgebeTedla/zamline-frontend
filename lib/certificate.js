import { api } from "@/lib/api";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

export function certificateError(file) {
  if (!file) return "Please choose your PACRA certificate.";
  if (!ALLOWED_TYPES.includes(file.type))
    return "The certificate must be a PDF, JPG or PNG file.";
  if (file.size > MAX_BYTES) return "The certificate must be 10 MB or smaller.";
  return "";
}

export function uploadCertificate(companyId, file) {
  const form = new FormData();
  form.append("certificate_file", file);
  return api(`/companies/${companyId}/verify-certificate`, {
    form,
    auth: true,
  });
}
