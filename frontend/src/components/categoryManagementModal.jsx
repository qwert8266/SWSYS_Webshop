import { useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";
import { getCategoryBannerPath } from "../utils/productHelpers";

const EMPTY_FORM = { 
  name: "", 
  slug: "", 
  sentence: "", 
  banner: null
}

/** Displays category creation, editing and deletion inside the product management page */
function CategoryManagementModal({ categories, accessToken, onClose, onCategoriesChange }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingSlug, setEditingSlug] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    setError("");
  }, [editingSlug]);

  /** Copies an existing categorie into the form and switches to edit mode */
  function startEdit(category) {
    setEditingSlug(category.slug);
    setForm({ 
      name: category.name || "", 
      slug: category.slug || "",
      sentence: category.sentence || "",
      banner: null,
    });
  }

  /** Clears the form and returns to create mode */
  function resetForm() {
    setEditingSlug("");
    setForm(EMPTY_FORM);
    setError("");
  }

  /** Builds the multipart body */
  function buildFormBody() {
    const body = new FormData();
    body.append("data", JSON.stringify({ 
      name: form.name, 
      slug: form.slug,
      sentence: form.sentence,
    }));
    if (form.banner) body.append("banner", form.banner);
    return body;
  }

  /** Validates and either creates a new category or updates the selected category  */
  async function saveCategory(event) {
    event.preventDefault();
    setError("");

    if(!form.name.trim()) return setError("Bitte gib einen Kategorienamen an");
    if(!form.sentence.trim()) return setError("Bitte gib einen Satz an");
    if(!editingSlug && !form.banner) return setError("Bitte wähle ein Bannerbild aus");

    setIsSaving(true);
    try {
      const saved = editingSlug
        ? await categoryApi.updateCategory(editingSlug, buildFormBody(), accessToken)
        : await categoryApi.createCatgeory(buildFormBody(), accessToken);

      // Replace the edited entry or append the newly created catgory without reloading the page
      const nextCategories = editingSlug
        ? categories.map((category) => category.slug === editingSlug ? saved : category)
        : [...categories, saved];

      nextCategories.sort((a, b) => 
        String(a?.name || "").localeCompare(
          String(b?.name || ""),
          "de",
        )
      );
      onCategoriesChange(nextCategories);
      resetForm();
    } catch (saveError) {
      setError(saveError.message || "Kategorie konnte nicht gespeichert werden");
    } finally {
      setIsSaving(false);
    }
  }

  
  async function removeCategory(category) {
    if (!window.confirm(`Kategorie "${category.name}" wirklich löschen?`)) return;
    setError("");

    try {
      await categoryApi.deleteCategory(category.slug, accessToken);
      onCategoriesChange(categories.filter((item) => item.slug !== category.slug));
      if (editingSlug === category.slug) resetForm();
    } catch (deleteError) {
      setError(deleteError.message || "Kategorie konnte nicht gelöscht werden");
    }
  }

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", zIndex: 10000 }}
    >
      <div
        className="bg-white rounded shadow p-4" 
        style={{ width: "min(960px, 94vw)", maxHeight: "90vh", overflowY: "auto"}}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="mb-1">Produkt-Kategorien</h3>
          </div>
          <button 
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Schließen"
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          <div className="col-lg-7">
            {categories.length === 0 ? (
              <div className="alert alert-info mb-0">
                Noch keine Kategorie vorhanden. Lege recht die erste Kategorie an.
              </div>
            ) : (
              <div className="list-group">
                {categories.map((category) => (
                  <div key={category.slug} className="list-group-item d-flex gap-3 align-items-center">
                    <img 
                      src={getCategoryBannerPath(category)} 
                      alt="" 
                      className="rounded border"
                      style={{ width: 120, height: 68, objectFit: "cover" }}
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <strong>{category.name}</strong>
                      <div className="small text-muted">/{category.slug}</div>
                      <div className="small text-truncate" title={category.sentence}>{category.sentence}</div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => startEdit(category)}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button" 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => removeCategory(category)}
                      >
                        Löschen
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-5">
            <form className="border rounded p-3" onSubmit={saveCategory}>
              <h5>{editingSlug ? "Kategorie bearbeiten" : "Kategorie hinzufügen"}</h5>
              <label className="form-label mt-2">Name</label>
              <input 
                className="form-control" 
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              
              <label className="form-label mt-4">Slug <span className="text-muted small">(optional)</span></label>
              <input 
                className="form-control" 
                placeholder="wird aus dem Namen erzeugt"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              />

              <label className="form-label mt-3">Banner-Satz</label>
              <input 
                className="form-control" 
                value={form.sentence}
                onChange={(event) => setForm((current) => ({ ...current, sentence: event.target.value }))}
              />

              <label className="form-label mt-3">Bannerbild</label>
              <input 
                className="form-control" 
                type="file"
                accept="image/png, image/jpg, image/jpeg, image/webp"
                onChange={(event) => setForm((current) => ({ ...current, banner: event.target.files?.[0] || null }))}
              />
              {editingSlug && <div className="form-text">Ohne neue Datei bleibt das bisherige Banner erhalten</div>}

              <div className="d-flex gap-2 mt-4">
                <button 
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Speichert ..." : "Speichern"}
                </button>
                {editingSlug && <button type="button" className="btn btn-secondary" onClick={resetForm}>Abbrechen</button>}

              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryManagementModal;