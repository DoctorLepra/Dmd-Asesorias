import React, { useState, useEffect, useMemo } from 'react';
import type { UserData } from './UserManager.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import PasswordStrengthMeter from '../common/PasswordStrengthMeter.tsx';
import { getPasswordValidationState } from '../../utils/passwordValidator.ts';

interface UserFormModalProps {
  userToEdit: UserData | null;
  onClose: () => void;
  onSave: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ userToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    company: '',
    contactNumber: '',
    role: 'VISITOR' as UserData['role'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!userToEdit;
  const passwordValidation = useMemo(() => getPasswordValidationState(formData.password), [formData.password]);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        email: userToEdit.email || '',
        password: '',
        fullName: userToEdit.full_name || '',
        company: userToEdit.company || '',
        contactNumber: userToEdit.contact_number || '',
        role: userToEdit.role || 'VISITOR',
      });
    }
  }, [userToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEditing && !passwordValidation.isValid) {
      setError('La contraseña no cumple los requisitos.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userId: userToEdit?.id,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        fullName: formData.fullName,
        company: formData.company,
        contactNumber: formData.contactNumber,
      };

      const response = await fetch('/api/create-update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error en el servidor.');
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#212147]";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Cerrar modal">
          <span className="material-symbols-outlined text-3xl">cancel</span>
        </button>
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Correo electrónico" required disabled={isEditing} className={`${inputClasses} ${isEditing ? 'bg-slate-100' : ''}`} />
            {!isEditing && (
              <div>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Contraseña" required className={inputClasses} />
                {formData.password.length > 0 && <PasswordStrengthMeter validationState={passwordValidation} />}
              </div>
            )}
            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Nombre completo" required className={inputClasses} />
            <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="Empresa" className={inputClasses} />
            <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="Número de contacto" className={inputClasses} />
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <select id="role" name="role" value={formData.role} onChange={handleInputChange} className={inputClasses}>
                <option value="VISITOR">Cliente</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMINISTRATOR">Administrador</option>
              </select>
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

export default UserFormModal;