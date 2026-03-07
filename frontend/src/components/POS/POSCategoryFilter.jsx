import { Button } from "react-bootstrap";

export default function POSCategoryFilter({ categories, selectedCategoryId, onSelectCategory }) {
    const rootCategories = categories.filter(c => !c.parentId);

    return (
        <div className="category-scroll-wrapper mb-4">
            <div className="d-flex gap-2 overflow-auto pb-2 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <Button
                    variant={!selectedCategoryId ? "primary" : "outline-light"}
                    size="sm"
                    className={`category-chip px-3 rounded-pill border-0 ${!selectedCategoryId ? 'active glass-active bg-primary' : 'glass-dark'}`}
                    onClick={() => onSelectCategory("")}
                    style={{ whiteSpace: 'nowrap', minWidth: '60px' }}
                >
                    All
                </Button>
                {rootCategories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={selectedCategoryId === cat.id ? "primary" : "outline-light"}
                        size="sm"
                        className={`category-chip px-3 rounded-pill border-0 ${selectedCategoryId === cat.id ? 'active glass-active bg-primary' : 'glass-dark'}`}
                        onClick={() => onSelectCategory(cat.id)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}
