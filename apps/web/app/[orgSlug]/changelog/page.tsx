import { ChangelogContent } from '../../../components/marketing/changelog-content';

// Same content as the public /changelog page, without the marketing nav/footer
// (login/signup, pricing, etc.) — those don't make sense once you're already
// signed in and inside a workspace.
export default function OrgChangelogPage() {
  return <ChangelogContent />;
}
