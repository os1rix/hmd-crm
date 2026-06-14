"use client";

import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import { requestJson } from "@/lib/api-client";
import { roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/session";
import {
  APPEARANCES,
  DEFAULT_USER_PREFERENCES,
  LANGUAGES,
  NOTIFICATION_OPTIONS,
  type NotificationPrefs,
  type UserPreferences,
} from "@/lib/user-preferences";
import { Bell, Globe, Lock, Palette, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SettingsData = {
  id: string;
  email: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  preferences: UserPreferences;
};

type Tab = "profile" | "general" | "security" | "notifications";

const TABS: Array<{ id: Tab; label: string; icon: typeof User }> = [
  { id: "profile", label: "Profile", icon: User },
  { id: "general", label: "General", icon: Globe },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function SettingsForm({ user }: { user: SessionUser }) {
  const toast = useToast();
  const router = useRouter();
  const { setAppearance } = useTheme();
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<string>(user.role);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson<SettingsData>("/api/settings");
      setName(data.name);
      setBio(data.bio);
      setAvatarUrl(data.avatarUrl);
      setEmail(data.email);
      setRole(data.role);
      setPreferences(data.preferences);
      setAppearance(data.preferences.appearance);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  }, [setAppearance, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    try {
      await requestJson("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, avatarUrl }),
      });
      toast("Profile saved");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveGeneral() {
    setSaving(true);
    try {
      await requestJson("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      setAppearance(preferences.appearance);
      document.documentElement.lang = preferences.language;
      toast("General settings saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    setSaving(true);
    try {
      await requestJson("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      toast("Notification preferences saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save notifications", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }
    setChangingPassword(true);
    try {
      await requestJson("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  }

  function onAvatarPick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file", "error");
      return;
    }
    if (file.size > 500_000) {
      toast("Image must be under 500 KB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function toggleNotification(key: keyof NotificationPrefs) {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 lg:flex-row">
      <aside className="lg:w-52">
        <h1 className="mb-1 text-2xl font-semibold">Settings</h1>
        <p className="mb-6 text-sm text-muted">Manage your account and preferences</p>
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-left text-sm transition lg:w-full ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-transparent text-muted hover:border-border hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 border border-border p-6">
        {tab === "profile" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-medium">Profile</h2>
              <p className="text-sm text-muted">Your public info visible across the CRM</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <UserAvatar name={name} imageUrl={avatarUrl} size="xl" />
              <div className="space-y-2">
                <label className="block">
                  <span className="sr-only">Upload profile picture</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => onAvatarPick(e.target.files?.[0] ?? null)}
                    className="text-sm text-muted file:mr-3 file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="text-xs text-muted hover:text-danger"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Display name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                value={email}
                disabled
                className="w-full border border-border bg-surface/50 px-3 py-2 text-sm text-muted"
              />
              <p className="text-xs text-muted">Email is managed by your organization</p>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Role</span>
              <input
                value={roleLabel(role)}
                disabled
                className="w-full border border-border bg-surface/50 px-3 py-2 text-sm text-muted"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="A short intro — territory focus, specialties, or how to reach you…"
                className="w-full border border-border bg-background px-3 py-2 text-sm leading-relaxed"
              />
              <p className="text-xs text-muted">{bio.length}/500</p>
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </section>
        )}

        {tab === "general" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-medium">General</h2>
              <p className="text-sm text-muted">Language and appearance preferences</p>
            </div>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-muted" />
                Language
              </span>
              <select
                value={preferences.language}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    language: e.target.value as UserPreferences["language"],
                  }))
                }
                className="w-full max-w-xs border border-border bg-background px-3 py-2 text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">UI language for labels and date formats</p>
            </label>

            <div className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4 text-muted" />
                Appearance
              </span>
              <div className="flex flex-wrap gap-2">
                {APPEARANCES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPreferences((prev) => ({ ...prev, appearance: option.value }));
                      setAppearance(option.value);
                    }}
                    className={`border px-4 py-2 text-sm transition ${
                      preferences.appearance === option.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted hover:border-card-hover"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">Choose dark, light, or match your system</p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveGeneral}
              className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save general settings"}
            </button>
          </section>
        )}

        {tab === "security" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-medium">Security</h2>
              <p className="text-sm text-muted">Update your password</p>
            </div>

            <label className="block max-w-md space-y-1.5">
              <span className="text-sm font-medium">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block max-w-md space-y-1.5">
              <span className="text-sm font-medium">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted">At least 8 characters</p>
            </label>

            <label className="block max-w-md space-y-1.5">
              <span className="text-sm font-medium">Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <button
              type="button"
              disabled={changingPassword || !currentPassword || !newPassword}
              onClick={changePassword}
              className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {changingPassword ? "Updating…" : "Change password"}
            </button>

            <p className="max-w-md text-xs text-muted">
              Demo accounts use the default password <strong>demo123</strong> until you change it.
            </p>
          </section>
        )}

        {tab === "notifications" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-medium">Notifications</h2>
              <p className="text-sm text-muted">Choose what you want to be notified about</p>
            </div>

            <div className="divide-y divide-border border border-border">
              {NOTIFICATION_OPTIONS.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-start justify-between gap-4 px-4 py-4 hover:bg-surface/40"
                >
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted">{option.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notifications[option.key]}
                    onChange={() => toggleNotification(option.key)}
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveNotifications}
              className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save notification preferences"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

export function SettingsClient({ user }: { user: SessionUser }) {
  return <SettingsForm user={user} />;
}
