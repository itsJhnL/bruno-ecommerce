import { ProfileForm } from "@/components/account/profile-form";
import { requireAccountUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await requireAccountUser("/account/profile");

  return (
    <div>
      <h2 className="display-s text-ink-primary">Your details</h2>
      <p className="mt-3 max-w-lg text-sm text-ink-secondary">
        How we address you, and how a courier reaches you.
      </p>

      <div className="mt-8">
        <ProfileForm
          initial={{
            fullName: user.fullName ?? "",
            email: user.email,
            phone: user.phone ?? "",
            acceptsMarketing: user.acceptsMarketing,
          }}
        />
      </div>
    </div>
  );
}
