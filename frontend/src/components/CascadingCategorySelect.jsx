import { Form } from "react-bootstrap";

export default function CascadingCategorySelect({ categories, selectedId, onSelect }) {
    const path = [];

    const findPath = (id) => {
        const cat = categories.find(c => c.id === parseInt(id));
        if (cat) {
            path.unshift(cat);
            if (cat.parentId) findPath(cat.parentId);
        }
    };

    if (selectedId) findPath(selectedId);

    const renders = [];
    const roots = categories.filter(c => !c.parentId);

    // Render Level 0
    renders.push(
        <Form.Select
            key="root"
            value={path[0]?.id || ""}
            onChange={e => {
                const val = e.target.value;
                onSelect(val ? parseInt(val) : null);
            }}
            className="bg-dark text-light border-secondary shadow-none mb-2"
        >
            <option value="">Select Main Category</option>
            {roots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Form.Select>
    );

    let lastSelected = path[0];
    let depth = 1;

    while (lastSelected) {
        const children = categories.filter(c => c.parentId === lastSelected.id);
        if (children.length === 0) break;

        const currentSelectionAtThisLevel = path[depth];
        const parentOfThisLevel = lastSelected;

        renders.push(
            <div key={`level-wrap-${depth}`} className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-arrow-return-right text-muted ms-2"></i>
                <Form.Select
                    value={currentSelectionAtThisLevel?.id || ""}
                    onChange={e => {
                        const val = e.target.value;
                        onSelect(val ? parseInt(val) : parentOfThisLevel.id);
                    }}
                    className="bg-dark text-light border-secondary shadow-none flex-grow-1"
                >
                    <option value="">Select Sub-category</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
            </div>
        );

        if (!currentSelectionAtThisLevel) break;
        lastSelected = currentSelectionAtThisLevel;
        depth++;
    }

    return renders;
}
