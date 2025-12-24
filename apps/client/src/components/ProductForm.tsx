import { useState } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';

export const ProductForm = ({ onClose }: { onClose?: () => void }) => {
    const [product, setProduct] = useState({
        name: '',
        brandId: 1, // Defaulting to 1 for now, ideally fetch brands
        categoryId: 1, // Defaulting to 1
        description: '',
        gstRate: 18.0
    });

    const [variants, setVariants] = useState<any[]>([
        { sku: '', barcode: '', size: '', color: '', costPrice: '', mrp: '', sellingPrice: '', initialStock: 0 }
    ]);

    const handleProductChange = (e: any) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleVariantChange = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        // Auto-generate SKU if empty
        if (field === 'size' || field === 'color') {
            // specific logic could go here
        }
        setVariants(newVariants);
    };

    const addVariant = () => {
        setVariants([...variants, { sku: '', barcode: '', size: '', color: '', costPrice: '', mrp: '', sellingPrice: '', initialStock: 0 }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Auto generate SKU for variants if missing
            const preparedVariants = variants.map((v) => ({
                ...v,
                sku: v.sku || `${product.name.substring(0, 3).toUpperCase()}-${v.size}-${Math.floor(Math.random() * 1000)}`,
                barcode: v.barcode || Math.floor(10000000 + Math.random() * 90000000).toString(),
                costPrice: Number(v.costPrice),
                mrp: Number(v.mrp),
                sellingPrice: Number(v.sellingPrice),
                initialStock: Number(v.initialStock)
            }));

            await axios.post('http://localhost:3000/api/v1/products', {
                ...product,
                gstRate: Number(product.gstRate),
                variants: preparedVariants
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Product Created Successfully!');
            if (onClose) onClose();
            // Reset form
            setProduct({ name: '', brandId: 1, categoryId: 1, description: '', gstRate: 18.0 });
            setVariants([{ sku: '', barcode: '', size: '', color: '', costPrice: '', mrp: '', sellingPrice: '', initialStock: 0 }]);
        } catch (err: any) {
            console.error(err);
            alert('Failed to create product');
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add New Product</h2>

            <form onSubmit={handleSubmit}>
                {/* Product Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label className="label">Product Name</label>
                        <input className="input-field" name="name" value={product.name} onChange={handleProductChange} required />
                    </div>
                    <div>
                        <label className="label">GST Rate (%)</label>
                        <input className="input-field" type="number" name="gstRate" value={product.gstRate} onChange={handleProductChange} />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="label">Description</label>
                    <textarea className="input-field" name="description" value={product.description} onChange={handleProductChange} rows={2} />
                </div>

                {/* Variants Section */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    Variants
                    <button type="button" onClick={addVariant} className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#3b82f6', color: 'white' }}>
                        <FaPlus /> Add Variant
                    </button>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {variants.map((variant, index) => (
                        <div key={index} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) auto', gap: '0.5rem', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Size</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} value={variant.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} placeholder="Size" required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Color</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} value={variant.color} onChange={e => handleVariantChange(index, 'color', e.target.value)} placeholder="Color" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Cost</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} type="number" value={variant.costPrice} onChange={e => handleVariantChange(index, 'costPrice', e.target.value)} placeholder="Cost" required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>MRP</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} type="number" value={variant.mrp} onChange={e => handleVariantChange(index, 'mrp', e.target.value)} placeholder="MRP" required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sell Price</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} type="number" value={variant.sellingPrice} onChange={e => handleVariantChange(index, 'sellingPrice', e.target.value)} placeholder="Sell" required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Stock</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} type="number" value={variant.initialStock} onChange={e => handleVariantChange(index, 'initialStock', e.target.value)} placeholder="Qty" />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SKU (Auto)</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} value={variant.sku} onChange={e => handleVariantChange(index, 'sku', e.target.value)} placeholder="Leave blank to auto-gen" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Low Stock Threshold</label>
                                <input className="input-field" style={{ padding: '0.5rem' }} type="number" value={variant.lowStockThreshold} onChange={e => handleVariantChange(index, 'lowStockThreshold', e.target.value)} placeholder="5" />
                            </div>
                            <button type="button" onClick={() => removeVariant(index)} style={{ color: '#ef4444', padding: '0.5rem' }}>
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {onClose && <button type="button" onClick={onClose} className="btn" style={{ background: 'transparent' }}>Cancel</button>}
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                        <FaSave /> Save Product
                    </button>
                </div>
            </form>
        </div>
    );
};
