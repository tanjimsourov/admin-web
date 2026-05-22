import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PauseCircle, Plus, X } from "lucide-react";
import { platformAdminApi, PlatformOffer } from "../api/client";

type OfferFormState = {
  name: string;
  code: string;
  headline: string;
  description: string;
  offer_type: string;
  target_plan: string;
  discount_value: string;
  duration_in_months: string;
  seats_delta: string;
  cta_url: string;
  status: string;
};

const initialForm: OfferFormState = {
  name: "",
  code: "",
  headline: "",
  description: "",
  offer_type: "percentage",
  target_plan: "all",
  discount_value: "10.00",
  duration_in_months: "1",
  seats_delta: "0",
  cta_url: "",
  status: "draft",
};

const offerTypeLabels: Record<string, string> = {
  percentage: "Percentage discount",
  fixed: "Fixed discount",
  trial_extension: "Trial extension",
  seat_bonus: "Seat bonus",
  custom: "Custom",
};

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-slate-100 text-slate-600";
    case "paused":
      return "bg-amber-100 text-amber-700";
    case "archived":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "No end date";
  return new Date(value).toLocaleDateString();
}

function offerValueLabel(offer: PlatformOffer) {
  if (offer.offer_type === "trial_extension") return `${offer.duration_in_months} month trial`;
  if (offer.offer_type === "seat_bonus") return `${offer.seats_delta} seats`;
  if (offer.offer_type === "percentage") return `${offer.discount_value}%`;
  if (offer.offer_type === "fixed") return `$${offer.discount_value}`;
  return offer.discount_value;
}

export default function Offers() {
  const [offers, setOffers] = useState<PlatformOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formData, setFormData] = useState<OfferFormState>(initialForm);

  const activeCount = useMemo(() => offers.filter((offer) => offer.status === "active").length, [offers]);
  const enterpriseCount = useMemo(() => offers.filter((offer) => offer.target_plan === "enterprise").length, [offers]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await platformAdminApi.offers();
      setOffers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOffers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await platformAdminApi.createOffer({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discount_value: formData.discount_value || "0",
        duration_in_months: Number(formData.duration_in_months || 1),
        seats_delta: Number(formData.seats_delta || 0),
      });
      setShowForm(false);
      setFormData(initialForm);
      await loadOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (offer: PlatformOffer, status: string) => {
    try {
      setActionLoading(offer.id);
      await platformAdminApi.updateOffer(offer.id, { status });
      await loadOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update offer");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offers</h1>
          <p className="mt-1 text-sm text-slate-500">Create discount, trial-extension, seat-bonus, and enterprise promos for campaign targeting.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus size={18} />
          New Offer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Total offers</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{offers.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Active</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Enterprise targeted</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{enterpriseCount}</p>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Create Offer</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Name
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Code
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Headline
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Type
                  <select value={formData.offer_type} onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    {Object.entries(offerTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Discount
                  <input type="number" min="0" step="0.01" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Duration months
                  <input type="number" min="1" step="1" value={formData.duration_in_months} onChange={(e) => setFormData({ ...formData, duration_in_months: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Seat bonus
                  <input type="number" step="1" value={formData.seats_delta} onChange={(e) => setFormData({ ...formData, seats_delta: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Target plan
                  <select value={formData.target_plan} onChange={(e) => setFormData({ ...formData, target_plan: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    <option value="all">All plans</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Status
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                CTA URL
                <input
                  type="url"
                  value={formData.cta_url}
                  onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {submitting ? "Creating..." : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No offers found</div>
        ) : (
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Offer</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Code</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Value</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Target</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Window</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{offer.name}</p>
                    <p className="max-w-md truncate text-sm text-slate-500">{offer.headline || offer.description}</p>
                  </td>
                  <td className="px-5 py-4">
                    <code className="rounded bg-slate-100 px-2 py-1 text-sm">{offer.code}</code>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <p>{offerValueLabel(offer)}</p>
                    <p className="text-xs text-slate-400">{offerTypeLabels[offer.offer_type] || offer.offer_type}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{offer.target_plan.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <p>{formatDate(offer.starts_at)}</p>
                    <p className="text-xs text-slate-400">{formatDate(offer.ends_at)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(offer.status)}`}>{offer.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {offer.status !== "active" && offer.status !== "archived" ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(offer, "active")}
                          disabled={actionLoading === offer.id}
                          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Activate
                        </button>
                      ) : null}
                      {offer.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(offer, "paused")}
                          disabled={actionLoading === offer.id}
                          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                        >
                          <PauseCircle size={16} />
                          Pause
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
