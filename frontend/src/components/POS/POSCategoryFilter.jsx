import { Button } from "react-bootstrap";

export default function POSCategoryFilter({ categories, selectedCategoryId, onSelectCategory }) {
    const rootCategories = categories.filter(c => !c.parentId);

    return (
        <div className="category-scroll-wrapper mb-4">
            <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <Button
                    variant={!selectedCategoryId ? "primary" : "outline-light"}
                    size="sm"
                    className={`category-chip ${!selectedCategoryId ? 'active' : ''}`}
                    onClick={() => onSelectCategory("")}
                >
                    All
                </Button>
                {rootCategories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={selectedCategoryId === cat.id ? "primary" : "outline-light"}
                        size="sm"
                        className={`category-chip ${selectedCategoryId === cat.id ? 'active' : ''} parent-chip`}
                        onClick={() => onSelectCategory(cat.id)}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}
