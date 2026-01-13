import React, { useState, useMemo } from 'react';
import { View } from '../App.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import LoadingSpinner from './common/LoadingSpinner.tsx';
import PasswordStrengthMeter from './common/PasswordStrengthMeter.tsx';
import { getPasswordValidationState } from '../utils/passwordValidator.ts';

interface AuthPageProps {
  setView: (view: View) => void;
}

type Mode = 'login' | 'signup' | 'forgotPassword';

const AuthPage: React.FC<AuthPageProps> = ({ setView }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const passwordValidation = useMemo(() => getPasswordValidationState(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setNeedsVerification(false);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
         if (!passwordValidation.isValid) {
            throw new Error("La contraseña no cumple con los requisitos de seguridad.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              company: company,
              contact_number: contactNumber,
            },
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) {
            throw new Error("El usuario ya existe. Por favor, inicia sesión.");
        }
        setNeedsVerification(true);
      } else if (mode === 'forgotPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCompany('');
    setContactNumber('');
    setError(null);
    setMessage(null);
  };

  if (needsVerification) {
    return (
       <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200 text-center">
            <h2 className="text-2xl font-bold text-slate-900">¡Gracias por registrarte!</h2>
            <p className="text-slate-600">
                Hemos enviado un correo de verificación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
             <button onClick={() => setView('landing')} className="mt-4 font-medium text-[#212147] hover:text-[#1b1b3a]">
              Volver al inicio
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center">
          <span className="material-symbols-outlined mx-auto h-12 w-auto text-[#212147]" style={{fontSize: '48px'}}>auto_awesome</span>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            {mode === 'login' && 'Accede a tu portal'}
            {mode === 'signup' && 'Crea tu cuenta'}
            {mode === 'forgotPassword' && 'Restablecer Contraseña'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            o{' '}
            <button onClick={() => setView('landing')} className="font-medium text-[#212147] hover:text-[#1b1b3a]">
              vuelve al inicio
            </button>
          </p>
        </div>
        
        {message ? (
          <div className="text-center">
            <p className="text-green-600 bg-green-50 p-4 rounded-lg">{message}</p>
            <button onClick={() => { setMode('login'); resetForm(); }} className="mt-4 font-medium text-[#212147] hover:text-[#1b1b3a]">
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              {mode === 'signup' && (
                <>
                  <div>
                      <label htmlFor="full-name" className="sr-only">Nombre completo</label>
                      <input id="full-name" name="full-name" type="text" required className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div>
                      <label htmlFor="company" className="sr-only">Empresa</label>
                      <input id="company" name="company" type="text" required className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" placeholder="Empresa a la que pertenece" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div>
                      <label htmlFor="contact-number" className="sr-only">Número de contacto</label>
                      <input 
                        id="contact-number" 
                        name="contact-number" 
                        type="tel" 
                        inputMode="numeric"
                        required 
                        className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" 
                        placeholder="Número de contacto" 
                        value={contactNumber} 
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/\D/g, '');
                          setContactNumber(numericValue);
                        }} 
                      />
                  </div>
                </>
              )}
              { (mode === 'login' || mode === 'signup' || mode === 'forgotPassword') && (
                <div>
                  <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
                  <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              )}
              { (mode === 'login' || mode === 'signup') && (
                <div>
                  <label htmlFor="password" className="sr-only">Contraseña</label>
                  <input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required className="appearance-none block w-full px-3 py-2 border border-slate-300 bg-white placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-[#212147] focus:border-[#212147] sm:text-sm" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              )}
              {mode === 'signup' && password.length > 0 && <PasswordStrengthMeter validationState={passwordValidation} />}
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div className="text-center space-y-4">
              <button
                type="submit"
                disabled={loading || (mode === 'signup' && !passwordValidation.isValid)}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#212147] hover:bg-[#1b1b3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b1b3a] disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <LoadingSpinner /> : 
                  (mode === 'login' ? 'Iniciar Sesión' : 
                  (mode === 'signup' ? 'Registrarse' : 'Enviar enlace'))
                }
              </button>
               {mode === 'login' && (
                <div className="text-sm">
                  <button type="button" onClick={() => { setMode('forgotPassword'); resetForm(); }} className="font-medium text-[#212147] hover:text-[#1b1b3a]">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        <div className="text-sm text-center">
            {mode === 'login' && (
                <button onClick={() => { setMode('signup'); resetForm(); }} className="font-medium text-[#212147] hover:text-[#1b1b3a]">
                    ¿No tienes una cuenta? Regístrate
                </button>
            )}
            {mode === 'signup' && (
                 <button onClick={() => { setMode('login'); resetForm(); }} className="font-medium text-[#212147] hover:text-[#1b1b3a]">
                    ¿Ya tienes una cuenta? Inicia sesión
                </button>
            )}
             {mode === 'forgotPassword' && !message && (
                 <button onClick={() => { setMode('login'); resetForm(); }} className="font-medium text-[#212147] hover:text-[#1b1b3a]">
                    Volver a Iniciar Sesión
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;