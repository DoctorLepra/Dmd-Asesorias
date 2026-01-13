import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import LoadingSpinner from './common/LoadingSpinner.tsx';
import PasswordStrengthMeter from './common/PasswordStrengthMeter.tsx';
import { getPasswordValidationState } from '../utils/passwordValidator.ts';

interface UpdatePasswordPageProps {
    onUpdate: () => void;
}

const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({ onUpdate }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const passwordValidation = useMemo(() => getPasswordValidationState(password), [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!passwordValidation.isValid) {
            setError('La contraseña no cumple con los requisitos de seguridad.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
       
        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200 text-center">
                    <span className="material-symbols-outlined mx-auto text-green-500" style={{fontSize: '48px'}}>check_circle</span>
                    <h2 className="text-2xl font-bold text-slate-900">Contraseña Actualizada</h2>
                    <p className="text-slate-600">
                        Tu contraseña ha sido actualizada con éxito. Ahora puedes acceder a tu portal.
                    </p>
                    <button onClick={onUpdate} className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#212147] hover:bg-[#1b1b3a]">
                        Ir al Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                        Restablecer Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Ingresa tu nueva contraseña.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="password" className="sr-only">Nueva Contraseña</label>
                            <input id="password" name="password" type="password" required className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" placeholder="Nueva Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                         {password.length > 0 && <PasswordStrengthMeter validationState={passwordValidation} />}
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">Confirmar Nueva Contraseña</label>
                            <input id="confirm-password" name="confirm-password" type="password" required className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" placeholder="Confirmar Nueva Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading || !passwordValidation.isValid || password !== confirmPassword} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#212147] hover:bg-[#1b1b3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b1b3a] disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {loading ? <LoadingSpinner /> : 'Actualizar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdatePasswordPage;