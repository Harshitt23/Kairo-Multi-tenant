import { BlogContent } from '../../../components/marketing/blog-content';

// Same content as the public /blog page, without the marketing nav/footer
// (login/signup, pricing, etc.) — those don't make sense once you're already
// signed in and inside a workspace.
export default function OrgBlogPage() {
  return <BlogContent />;
}
