import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import ConfirmModal from '../common/ConfirmModal.tsx';

// --- TYPES ---
export interface Product {
  id: string;
  created_at: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

// --- SUB-COMPONENTS ---

const ProductFormModal: React.FC<{
  productToEdit: Product | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ productToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', description: '', price: 0 });
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        description: productToEdit.description,
        price: productToEdit.price,
      });
      setImageUrl(productToEdit.image_url);
    }
  }, [productToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || formData.price <= 0) {
      setError('Nombre y precio (mayor a 0) son obligatorios.');
      return;
    }
    if (!imageFile && !productToEdit) {
      setError('La imagen es obligatoria.');
      return;
    }
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        // Step 1: Get the signed URL from our Vercel function
        const uploadResponse = await fetch('/api/generate-upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: imageFile.name, contentType: imageFile.type }),
        });
        
        if (!uploadResponse.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, publicUrl } = await uploadResponse.json();

        // Step 2: Upload the file directly to R2
        await fetch(uploadUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
        });

        finalImageUrl = publicUrl;
      }
      
      const submissionData = { ...formData, image_url: finalImageUrl };

      const { error: dbError } = productToEdit
        ? await supabase.from('products').update(submissionData).eq('id', productToEdit.id)
        : await supabase.from('products').insert(submissionData);

      if (dbError) throw dbError;
      
      onSave();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const currentImageUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;
  const inputClasses = "w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#212147]";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><span className="material-symbols-outlined text-3xl">cancel</span></button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{productToEdit ? 'Editar Producto' : 'Añadir Producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre del Producto" required className={inputClasses}/>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descripción" required className={`${inputClasses} h-24`}/>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} placeholder="Precio" required className={inputClasses} step="0.01" min="0"/>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Imagen del Producto</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-[#212147] hover:file:bg-slate-100"/>
                  {currentImageUrl && <img src={currentImageUrl} alt="Preview" className="w-32 h-32 mt-2 rounded-lg object-cover border"/>}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" disabled={loading} className="py-2 px-4 bg-[#212147] text-white rounded-lg hover:bg-[#1b1b3a] disabled:bg-slate-400 w-36">
                        {loading ? <LoadingSpinner/> : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      alert('Error al cargar los productos.');
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleOpenDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
    if (error) {
      alert(`Error al eliminar: ${error.message}`);
    } else {
      // NOTE: You might want to delete the image from R2 here as well.
      // This requires another Vercel function for security.
    }
    
    setIsDeleting(false);
    setIsConfirmModalOpen(false);
    setProductToDelete(null);
    fetchProducts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Gestión de Productos</h2>
            <p className="text-slate-600 mt-1">Añade, edita y elimina productos del catálogo.</p>
        </div>
        <button onClick={handleCreate} className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all">
          <span className="material-symbols-outlined mr-2">add</span>
          Añadir Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? <p>Cargando productos...</p> : products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden group">
            <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover"/>
            <div className="p-4">
              <h3 className="font-bold text-slate-800 truncate">{product.name}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
              <p className="font-bold text-lg text-[#212147] mt-2">${product.price.toLocaleString('es-CO')}</p>
            </div>
            <div className="p-2 bg-slate-50 border-t flex justify-end gap-2">
               <button onClick={() => handleEdit(product)} className="p-2 rounded-full text-[#212147] hover:bg-slate-100 transition-colors" aria-label="Editar">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button onClick={() => handleOpenDeleteConfirm(product)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" aria-label="Eliminar">
                  <span className="material-symbols-outlined">delete</span>
                </button>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && !loading && <p className="text-center py-8 text-slate-500">No hay productos creados.</p>}

      {isModalOpen && <ProductFormModal productToEdit={editingProduct} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchProducts(); }} />}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={<>¿Estás seguro de que quieres eliminar el producto "<strong>{productToDelete?.name}</strong>"?</>}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductManager;