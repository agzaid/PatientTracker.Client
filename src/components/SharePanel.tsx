import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sharedLinksApi, type SharedLinkDto, type CreateSharedLinkRequest } from '@/services/sharedLinksApi';
import { toast } from 'sonner';
import {
  Share2, Plus, Copy, Trash2, ExternalLink, Clock, Eye, Shield,
  Link2, QrCode, CheckCircle2, XCircle, Globe
} from 'lucide-react';

const SharePanel: React.FC = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expiry, setExpiry] = useState('7d');
  const [categories, setCategories] = useState<string[]>(['medications', 'lab_tests', 'radiology', 'diagnoses', 'surgeries']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await sharedLinksApi.getSharedLinks();
      setLinks(data);
    } catch (error: any) {
      console.error('Failed to fetch shared links:', error);
      toast.error(error.error || 'Failed to fetch shared links');
    }
    setLoading(false);
  };

  const createLink = async () => {
    if (!user) return;
    setCreating(true);
    
    const request: CreateSharedLinkRequest = {
      categories,
      expiry
    };

    try {
      await sharedLinksApi.createSharedLink(request);
      toast.success('Shareable link created!');
      setShowCreate(false);
      fetchLinks();
    } catch (error: any) {
      console.error('Failed to create shared link:', error);
      toast.error(error.error || 'Failed to create link');
    }
    setCreating(false);
  };

  const deleteLink = async (id: number) => {
    if (!confirm('Delete this shared link?')) return;
    try {
      await sharedLinksApi.deleteSharedLink(id);
      toast.success('Link deleted');
      fetchLinks();
    } catch (error: any) {
      console.error('Failed to delete shared link:', error);
      toast.error(error.error || 'Failed to delete link');
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await sharedLinksApi.toggleSharedLink(id);
      toast.success(current ? 'Link deactivated' : 'Link activated');
      fetchLinks();
    } catch (error: any) {
      console.error('Failed to toggle shared link:', error);
      toast.error(error.error || 'Failed to toggle link');
    }
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getShareUrl = (token: string) => `${window.location.origin}/share/${token}`;

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categoryLabels: Record<string, string> = {
    medications: 'Medications',
    lab_tests: 'Lab Tests',
    radiology: 'Radiology',
    diagnoses: 'Diagnoses',
    surgeries: 'Surgeries',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-600" /> Share Profile
          </h2>
          <p className="text-sm text-gray-500">Generate secure links to share your health records with clinics</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-teal-500 to-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Share Link
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-5 border border-teal-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-teal-900 text-sm">How Sharing Works</h3>
            <ul className="mt-2 space-y-1 text-xs text-teal-700">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Generate a unique, secure link for your health profile</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Choose which categories to share (medications, labs, etc.)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Set expiration time for added security</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Clinics get read-only access - they cannot modify your data</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Revoke access anytime by deactivating or deleting the link</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Create Shareable Link</h3>
              <p className="text-xs text-gray-500 mt-1">Configure what to share and for how long</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories to Share</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        categories.includes(key)
                          ? 'bg-teal-100 text-teal-700 border border-teal-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Expiration</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '24h', label: '24 Hours' },
                    { value: '7d', label: '7 Days' },
                    { value: '30d', label: '30 Days' },
                    { value: 'never', label: 'Never' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        expiry === opt.value
                          ? 'bg-teal-100 text-teal-700 border border-teal-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createLink}
                  disabled={creating || categories.length === 0}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Generate Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Link2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No shared links yet</p>
          <p className="text-xs text-gray-400 mt-1">Create a link to share your health profile with clinics</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {links.map(link => {
            const expired = isExpired(link.expiresAt);
            const active = link.isActive && !expired;
            return (
              <div key={link.id} className={`bg-white rounded-xl border p-4 transition-all ${active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {active ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : expired ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {link.accessCount} views
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2 mb-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate font-mono">{getShareUrl(link.token)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(link.categories || []).map((cat: string) => (
                        <span key={cat} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                          {categoryLabels[cat] || cat}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
                      {link.expiresAt && (
                        <span className="text-xs text-gray-400">
                          Expires: {new Date(link.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      {!link.expiresAt && <span>No expiration</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => copyLink(link.token, link.id)}
                      className={`p-2 rounded-lg transition ${copiedId === link.id ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                      title="Copy link"
                    >
                      {copiedId === link.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleActive(link.id, link.isActive)}
                      className={`p-2 rounded-lg transition ${link.isActive ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-emerald-50 text-emerald-500'}`}
                      title={link.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {link.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharePanel;
