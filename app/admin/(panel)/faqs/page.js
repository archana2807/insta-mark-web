import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteFaq, saveFaq } from "@/lib/admin/actions/faqs";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import FaqFields from "@/components/admin/FaqFields";

export const metadata = { title: "FAQs" };

export default async function FaqsPage() {
  await requireAdmin();
  const prisma = await getPrisma();
  const [faqs, categories] = await Promise.all([
    prisma.faq.findMany({
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <h1 className="mb-1">FAQs</h1>
      <p className="text-secondary mb-4">
        General FAQs appear on the home page and on solution pages without their own FAQs. Category
        FAQs replace them on that solution page.
      </p>

      <div className="admin-card">
        <h2>Add FAQ</h2>
        <ActionForm action={saveFaq} resetOnSuccess>
          <FaqFields categories={categories} idPrefix="new" />
          <SubmitButton className="btn btn-dark btn-sm mt-2">Add FAQ</SubmitButton>
        </ActionForm>
      </div>

      <div className="admin-card">
        <h2>All FAQs ({faqs.length})</h2>
        {faqs.map((f) => (
          <div key={f.id} className="border-top pt-3 mt-3">
            <div className="small text-secondary mb-2">
              {f.category ? `${f.category.name} page` : "General"} {!f.isActive && "· hidden"}
            </div>
            <ActionForm action={saveFaq}>
              <input type="hidden" name="id" value={f.id} />
              <FaqFields faq={f} categories={categories} idPrefix={f.id} />
              <SubmitButton className="btn btn-outline-ink btn-sm mt-2">Save</SubmitButton>
            </ActionForm>
            <form action={deleteFaq} className="d-inline-block mt-2">
              <input type="hidden" name="id" value={f.id} />
              <SubmitButton
                className="btn btn-link btn-sm text-danger px-0"
                confirm="Delete this FAQ?"
              >
                Delete
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
