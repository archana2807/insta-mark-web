import PageHero from "@/components/sections/PageHero";
import * as settingService from "@/server/modules/settings/setting.service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Insta Mark collects and uses information submitted through this website.",
  path: "/privacy-policy",
});

// TODO(client/legal): DRAFT for review before launch. Retention periods match
// docs/database-design.md §9. Not legal advice.
export default async function PrivacyPolicyPage() {
  const site = await settingService.getSite();

  return (
    <>
      <PageHero
        title="Privacy Policy"
        lead="Draft — to be reviewed and approved by Insta Mark before launch."
        breadcrumbs={[{ label: "Privacy Policy", href: "/privacy-policy" }]}
      />
      <section className="pb-7">
        <div className="container" style={{ maxWidth: "48rem" }}>
          <h2 className="h4">What We Collect</h2>
          <p>
            When you submit an enquiry we collect the details you enter: name, company, email,
            phone, project location, requirement and message. We also record the page you submitted
            from and campaign parameters (UTM) to understand which pages generate enquiries. We do
            not store your IP address; a one-way hash is kept only to prevent spam.
          </p>
          <h2 className="h4 mt-5">How We Use It</h2>
          <p>
            Your details are used only to respond to your enquiry, prepare quotations and follow up
            on your project. We do not sell or share your information with third parties for
            marketing.
          </p>
          <h2 className="h4 mt-5">How Long We Keep It</h2>
          <p>
            Enquiries are retained for up to three years and then anonymised. Spam submissions are
            deleted after 90 days.
          </p>
          <h2 className="h4 mt-5">Your Rights</h2>
          <p>
            You can ask us to access, correct or delete your information at any time
            {site.contact.email ? (
              <>
                {" "}
                by writing to <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </>
            ) : (
              " through our contact page"
            )}
            .
          </p>
          <p className="small text-secondary mt-5 mb-0">{site.legalName}</p>
        </div>
      </section>
    </>
  );
}
