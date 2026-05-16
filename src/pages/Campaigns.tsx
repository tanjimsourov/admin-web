import React, { useEffect, useState } from "react";
import { Plus, X, Send } from "lucide-react";
import { platformAdminApi, PlatformCampaign } from "../api/client";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<PlatformCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    preview_text: "",
    body_text: "",
    audience_type: "all_users",
    status: "draft",
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await platformAdminApi.campaigns();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await platformAdminApi.createCampaign(formData);
      setShowForm(false);
      setFormData({
        name: "",
        subject: "",
        preview_text: "",
        body_text: "",
        audience_type: "all_users",
        status: "draft",
      });
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm("Are you sure you want to send this campaign?")) return;
    try {
      setSendingId(id);
      await platformAdminApi.sendCampaign(id);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Create Campaign</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preview Text
                </label>
                <input
                  type="text"
                  value={formData.preview_text}
                  onChange={(e) =>
                    setFormData({ ...formData, preview_text: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Body Text
                </label>
                <textarea
                  value={formData.body_text}
                  onChange={(e) =>
                    setFormData({ ...formData, body_text: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Audience
                </label>
                <select
                  value={formData.audience_type}
                  onChange={(e) =>
                    setFormData({ ...formData, audience_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all_users">All Users</option>
                  <option value="active_subscribers">Active Subscribers</option>
                  <option value="trialing_users">Trialing Users</option>
                  <option value="churned_users">Churned Users</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No campaigns found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Campaign
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Audience
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Recipients
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{campaign.name}</p>
                      <p className="text-sm text-slate-500">{campaign.subject}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {campaign.audience_type.replace(/_/g, " ")}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {campaign.status === "sent"
                      ? `${campaign.sent_count} sent`
                      : `${campaign.recipient_count} recipients`}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        campaign.status
                      )}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {campaign.status === "draft" && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        disabled={sendingId === campaign.id}
                        className="flex items-center gap-1.5 text-sm text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sendingId === campaign.id ? "Sending..." : "Send Now"}
                      </button>
                    )}
                    {campaign.status === "sent" && campaign.sent_at && (
                      <span className="text-xs text-slate-500">
                        Sent {new Date(campaign.sent_at).toLocaleDateString()}
                      </span>
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
