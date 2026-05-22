import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Send, X } from "lucide-react";
import { platformAdminApi, PlatformCampaign, PlatformOffer } from "../api/client";

type CampaignFormState = {
  name: string;
  subject: string;
  preview_text: string;
  body_text: string;
  body_html: string;
  audience_type: string;
  offer: string;
  status: string;
};

const initialForm: CampaignFormState = {
  name: "",
  subject: "",
  preview_text: "",
  body_text: "",
  body_html: "",
  audience_type: "all_users",
  offer: "",
  status: "draft",
};

const audienceLabels: Record<string, string> = {
  all_users: "All users",
  workspace_owners: "Workspace owners",
  active_subscribers: "Active subscribers",
  trialing: "Trialing",
  inactive_subscribers: "Inactive subscribers",
};

function getStatusColor(status: string) {
  switch (status) {
    case "sent":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-slate-100 text-slate-600";
    case "sending":
      return "bg-blue-100 text-blue-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(value: string | null) {
  if (!value) return "Not sent";
  return new Date(value).toLocaleString();
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<PlatformCampaign[]>([]);
  const [offers, setOffers] = useState<PlatformOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CampaignFormState>(initialForm);

  const draftCount = useMemo(() => campaigns.filter((campaign) => campaign.status === "draft").length, [campaigns]);
  const failedCount = useMemo(() => campaigns.filter((campaign) => campaign.status === "failed").length, [campaigns]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const [campaignData, offerData] = await Promise.all([
        platformAdminApi.campaigns(),
        platformAdminApi.offers(),
      ]);
      setCampaigns(campaignData);
      setOffers(offerData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await platformAdminApi.createCampaign({
        ...formData,
        offer: formData.offer ? Number(formData.offer) : null,
      });
      setShowForm(false);
      setFormData(initialForm);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (campaign: PlatformCampaign) => {
    if (!window.confirm(`Send "${campaign.name}" to ${audienceLabels[campaign.audience_type] || campaign.audience_type}?`)) return;
    try {
      setSendingId(campaign.id);
      await platformAdminApi.sendCampaign(campaign.id);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">Campaigns use the backend audience resolver and can attach an active offer for upgrade or enterprise outreach.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{campaigns.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Draft</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{draftCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Failed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{failedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Offers available</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{offers.filter((offer) => offer.status === "active").length}</p>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Create Campaign</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Campaign name
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Subject line
                  <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Preview text
                <input type="text" value={formData.preview_text} onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Audience
                  <select value={formData.audience_type} onChange={(e) => setFormData({ ...formData, audience_type: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    {Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Attached offer
                  <select value={formData.offer} onChange={(e) => setFormData({ ...formData, offer: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    <option value="">No offer</option>
                    {offers.filter((offer) => offer.status === "active").map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.code} - {offer.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Body text
                <textarea value={formData.body_text} onChange={(e) => setFormData({ ...formData, body_text: e.target.value })} rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                HTML body
                <textarea value={formData.body_html} onChange={(e) => setFormData({ ...formData, body_html: e.target.value })} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {submitting ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No campaigns found</div>
        ) : (
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Campaign</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Audience</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Offer</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Recipients</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{campaign.name}</p>
                    <p className="max-w-sm truncate text-sm text-slate-500">{campaign.subject}</p>
                    {campaign.last_error ? (
                      <p className="mt-2 flex max-w-sm items-start gap-1.5 text-xs text-red-600">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        {campaign.last_error}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{audienceLabels[campaign.audience_type] || campaign.audience_type.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {campaign.offer_name || (campaign.offer ? `Offer #${campaign.offer}` : "No offer")}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {campaign.status === "sent" ? `${campaign.sent_count} sent` : `${campaign.recipient_count} matched`}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(campaign.status)}`}>{campaign.status}</span>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(campaign.sent_at)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {campaign.status === "draft" || campaign.status === "failed" ? (
                      <button
                        type="button"
                        onClick={() => handleSend(campaign)}
                        disabled={sendingId === campaign.id}
                        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sendingId === campaign.id ? "Sending..." : campaign.status === "failed" ? "Retry" : "Send Now"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">No action available</span>
                    )}
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
