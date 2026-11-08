"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeleteConfirmationDialog } from "../../../components/DeleteConfirmationDialog";
import { EditCareerProfileDialog, CareerProfile } from "../../../components/EditCareerProfileDialog";
import { TransferHistoryLogsModal } from "../../../components/TransferHistoryLogsModal";

export default function CareerPage() {
  const [profiles, setProfiles] = useState<CareerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<CareerProfile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  
  // UI States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<CareerProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<CareerProfile | null>(null);
  const [transferModalTarget, setTransferModalTarget] = useState<CareerProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();

  // Helper to safely generate unique IDs
  const generateId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `profile_${crypto.randomUUID()}`;
    }
    return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Safe localStorage helper
  const saveProfilesToStorage = (updated: CareerProfile[]) => {
    try {
      localStorage.setItem("saved_career_profiles_v1", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save profiles to localStorage:", err);
    }
  };

  const saveActiveProfileToStorage = (profile: CareerProfile | null) => {
    try {
      if (profile) {
        localStorage.setItem("active_career_profile_v1", JSON.stringify(profile));
      } else {
        localStorage.removeItem("active_career_profile_v1");
      }
    } catch (err) {
      console.error("Failed to save active profile to localStorage:", err);
    }
  };

  useEffect(() => {
    try {
      // 1. Load profiles
      let loadedProfiles: CareerProfile[] = [];
      const savedProfilesRaw = localStorage.getItem("saved_career_profiles_v1");

      if (savedProfilesRaw) {
        try {
          const parsed = JSON.parse(savedProfilesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedProfiles = parsed;
          }
        } catch (e) {
          console.error("Error parsing saved_career_profiles_v1:", e);
        }
      }

      // If no valid profiles found, migrate or create sensible default
      if (loadedProfiles.length === 0) {
        const companies = JSON.parse(localStorage.getItem("saved_companies_v1") || '["Personal"]');
        const roles = JSON.parse(localStorage.getItem("saved_income_sources_v1") || '["Primary Role"]');

        const maxLength = Math.max(companies.length, roles.length, 1);
        for (let i = 0; i < maxLength; i++) {
          loadedProfiles.push({
            id: generateId(),
            company: companies[i] || "Personal",
            role: roles[i] || "Primary Role",
          });
        }
        saveProfilesToStorage(loadedProfiles);
      }

      setProfiles(loadedProfiles);

      // 2. Load active profile & validate against loaded profiles
      let currentActive: CareerProfile | null = null;
      const activeRaw = localStorage.getItem("active_career_profile_v1");

      if (activeRaw) {
        try {
          const parsedActive = JSON.parse(activeRaw);
          // Check if active profile still exists in loaded profiles
          const found = loadedProfiles.find((p) => p.id === parsedActive.id);
          if (found) {
            currentActive = found;
          }
        } catch (e) {
          console.error("Error parsing active_career_profile_v1:", e);
        }
      }

      // If no active profile or orphaned, default to first profile
      if (!currentActive && loadedProfiles.length > 0) {
        currentActive = loadedProfiles[0];
        saveActiveProfileToStorage(currentActive);
      }

      setActiveProfile(currentActive);
    } catch (err) {
      console.error("Error during career profiles initialization:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Quick Notification Toast Helper
  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Switch Active Profile
  const handleSelectProfile = (profile: CareerProfile) => {
    setActiveProfile(profile);
    saveActiveProfileToStorage(profile);
    showToast(`Switched active workspace to "${profile.company}"!`);
  };

  // Add New Profile
  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCompany = newCompany.trim();
    const cleanRole = newRole.trim();

    if (!cleanCompany || !cleanRole) {
      showToast("Please provide both a company name and a job title.", true);
      return;
    }

    // Check for duplicates
    const isDuplicate = profiles.some(
      (p) =>
        p.company.toLowerCase() === cleanCompany.toLowerCase() &&
        p.role.toLowerCase() === cleanRole.toLowerCase()
    );

    if (isDuplicate) {
      showToast(`A profile for "${cleanRole}" at "${cleanCompany}" already exists.`, true);
      return;
    }

    const newProfile: CareerProfile = {
      id: generateId(),
      company: cleanCompany,
      role: cleanRole,
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    saveProfilesToStorage(updated);

    // If there was no active profile, make this one active
    if (!activeProfile) {
      setActiveProfile(newProfile);
      saveActiveProfileToStorage(newProfile);
    }

    setNewCompany("");
    setNewRole("");
    showToast(`Added "${cleanCompany}" to your career profiles!`);
  };

  // Save Edited Profile
  const handleSaveEdit = (updatedProfile: CareerProfile) => {
    const updatedList = profiles.map((p) =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    setProfiles(updatedList);
    saveProfilesToStorage(updatedList);

    // If edited profile was active, update active storage and state
    if (activeProfile?.id === updatedProfile.id) {
      setActiveProfile(updatedProfile);
      saveActiveProfileToStorage(updatedProfile);
    }

    showToast(`Updated "${updatedProfile.company}" successfully!`);
  };

  // Confirm and Execute Profile Deletion
  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;

    if (profiles.length <= 1) {
      showToast("You must keep at least one career profile.", true);
      setProfileToDelete(null);
      return;
    }

    setIsDeleting(true);

    try {
      const idToRemove = profileToDelete.id;
      const updated = profiles.filter((p) => p.id !== idToRemove);
      setProfiles(updated);
      saveProfilesToStorage(updated);

      // Handle active profile cleanup if deleted
      if (activeProfile?.id === idToRemove) {
        const nextActive = updated[0] || null;
        setActiveProfile(nextActive);
        saveActiveProfileToStorage(nextActive);
        showToast(
          `Removed "${profileToDelete.company}". Switched active profile to "${nextActive?.company}".`
        );
      } else {
        showToast(`Removed "${profileToDelete.company}" from career profiles.`);
      }

      setProfileToDelete(null);
    } catch (err) {
      console.error("Error deleting profile:", err);
      showToast("Failed to delete profile. Please try again.", true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-32">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-5 py-4">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Career &amp; Workspaces
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Manage your job roles and active income streams
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-5 flex flex-col gap-5">
        {/* Floating Notification Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-sm">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-sm">
            <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
            <span className="flex-1">{successMsg}</span>
          </div>
        )}


        {/* Workspace Profiles List */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              All Workspaces
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Tap &quot;Set as Active&quot; to switch between accounts
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {profiles.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/70 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-slate-300 text-3xl">domain_disabled</span>
                <p className="text-xs text-slate-500 font-medium">No profiles created yet.</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;

                return (
                  <div
                    key={profile.id}
                    className={`rounded-xl border p-4 transition-colors flex flex-col gap-3 ${
                      isActive
                        ? "border-primary bg-primary/[0.02]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Company Avatar / Initial */}
                        <div
                          className={`size-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border ${
                            isActive
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {profile.company.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {profile.company}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-600 mt-0.5 break-words">
                            {profile.role}
                          </span>
                        </div>
                      </div>

                      {/* Action Icon Buttons: Unified neutral styling */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setTransferModalTarget(profile)}
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                          title={`Transfer history logs to ${profile.company}`}
                          aria-label={`Transfer logs to ${profile.company}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingProfile(profile)}
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Profile"
                          aria-label={`Edit ${profile.company}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProfileToDelete(profile)}
                          disabled={profiles.length <= 1}
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                          title={
                            profiles.length <= 1
                              ? "Cannot delete the only profile"
                              : "Delete Profile"
                          }
                          aria-label={`Delete ${profile.company}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Switch Button (Shown on inactive profiles only) */}
                    {!isActive && (
                      <div className="pt-2 border-t border-slate-100 flex items-center">
                        <button
                          type="button"
                          onClick={() => handleSelectProfile(profile)}
                          className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
                        >
                          <span className="material-symbols-outlined text-[15px]">check_circle</span>
                          Set as Active
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Add New Profile Form Card */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="size-9 rounded-xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">add_business</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Add Career Profile
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Create a new employer, client, or business stream
              </p>
            </div>
          </div>

          <form onSubmit={handleAddProfile} className="flex flex-col gap-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Company / Business Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  apartment
                </span>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp, Upwork Client, Freelance"
                  value={newCompany}
                  onChange={(e) => {
                    setNewCompany(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                Job Title / Income Source
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  badge
                </span>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Developer, Project Lead"
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newRole.trim() || !newCompany.trim()}
              className="mt-1 w-full bg-gradient-to-r from-[#001142] to-[#00236f] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Profile
            </button>
          </form>
        </section>
      </main>

      {/* Edit Career Profile Dialog */}
      <EditCareerProfileDialog
        isOpen={Boolean(editingProfile)}
        profile={editingProfile}
        existingProfiles={profiles}
        onClose={() => setEditingProfile(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Career Profile Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={Boolean(profileToDelete)}
        title="Delete Career Profile?"
        description={`Are you sure you want to delete "${profileToDelete?.company}" (${profileToDelete?.role})? Existing logs filed under this company will remain saved in your history.`}
        itemSummary={
          profileToDelete
            ? {
                cutoffType: profileToDelete.company,
                date: profileToDelete.role,
              }
            : undefined
        }
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) setProfileToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Batch Transfer History Logs Modal */}
      <TransferHistoryLogsModal
        isOpen={Boolean(transferModalTarget)}
        targetProfile={transferModalTarget}
        allProfiles={profiles}
        onClose={() => setTransferModalTarget(null)}
        onSuccess={(count, srcComp, targetComp) => {
          showToast(`Successfully transferred ${count} log${count === 1 ? "" : "s"} from "${srcComp}" to "${targetComp}"!`);
          router.refresh();
        }}
      />
    </div>
  );
}
