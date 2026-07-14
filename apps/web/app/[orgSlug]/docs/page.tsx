import { DocsContent } from '../../../components/marketing/docs-content';

// Same content as the public /docs page, without the marketing nav/footer
// (login/signup, pricing, etc.) — those don't make sense once you're already
// signed in and inside a workspace.
export default function OrgDocsPage() {
  return <DocsContent />;
}
