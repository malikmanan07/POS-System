import { useMemo } from "react";
import { Accordion, Badge, Row, Col, Form } from "react-bootstrap";

export default function HierarchicalCategoryPicker({
    categories,
    selectedIds,
    onToggle,
    searchTerm,
    expandedCats,
    setExpandedCats
}) {
    const structuredCategories = useMemo(() => {
        // Group categories by parent
        const roots = categories.filter(c => !c.parentId);
        const search = searchTerm.toLowerCase();

        const buildTree = (parentId) => {
            return categories
                .filter(c => String(c.parentId) === String(parentId))
                .map(c => ({
                    ...c,
                    children: buildTree(c.id)
                }));
        };

        let tree = roots.map(root => ({
            ...root,
            children: buildTree(root.id)
        }));

        if (search) {
            const filterTree = (nodes) => {
                return nodes.filter(node => {
                    const matches = node.name.toLowerCase().includes(search);
                    const childrenMatches = filterTree(node.children);
                    if (matches || childrenMatches.length > 0) {
                        node.children = childrenMatches;
                        return true;
                    }
                    return false;
                });
            };
            tree = filterTree(tree);
        }

        return tree;
    }, [categories, searchTerm]);

    const renderItem = (cat) => {
        const isSelected = selectedIds.includes(cat.id);
        const hasChildren = cat.children && cat.children.length > 0;

        return (
            <Accordion.Item eventKey={String(cat.id)} key={cat.id} className="border-0 bg-transparent">
                <div className={`item-row d-flex align-items-center py-2 px-3 ${isSelected ? 'bg-primary-soft' : ''}`}>
                    <div
                        className="cursor-pointer d-flex align-items-center flex-grow-1"
                        onClick={() => onToggle(cat.id)}
                    >
                        <span className="selection-dot me-3"></span>
                        <span className={`text-white small ${isSelected ? 'fw-bold ls-1' : ''}`}>{cat.name}</span>
                    </div>
                    {hasChildren && (
                        <Accordion.Header className="ms-auto" />
                    )}
                </div>
                {hasChildren && (
                    <Accordion.Body className="p-0 ps-4 border-start border-secondary-subtle ms-3">
                        <Accordion className="category-accordion">
                            {cat.children.map(child => renderItem(child))}
                        </Accordion>
                    </Accordion.Body>
                )}
            </Accordion.Item>
        );
    };

    return (
        <div className="border border-secondary-subtle rounded-3 overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {/* Selected Tags Display */}
            {selectedIds.length > 0 && (
                <div className="p-3 bg-black-25 border-bottom border-secondary-subtle d-flex flex-wrap gap-2">
                    {selectedIds.map(id => {
                        const cat = categories.find(c => c.id === id);
                        return cat ? (
                            <Badge key={id} bg="primary" className="d-flex align-items-center py-2 px-3 rounded-pill cursor-pointer" onClick={() => onToggle(id)}>
                                {cat.name} <i className="bi bi-x-lg ms-2 x-small"></i>
                            </Badge>
                        ) : null;
                    })}
                </div>
            )}

            <div className="category-list-scroll p-2 overflow-auto" style={{ maxHeight: '350px' }}>
                <Accordion className="category-accordion" alwaysOpen>
                    {structuredCategories.length > 0 ? (
                        structuredCategories.map(cat => renderItem(cat))
                    ) : (
                        <div className="text-center py-5 text-muted small">
                            <i className="bi bi-search mb-2 d-block fs-3 opacity-25"></i>
                            No categories found matching your search.
                        </div>
                    )}
                </Accordion>
            </div>
        </div>
    );
}
