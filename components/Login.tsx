import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Hexagon, Loader2, AlertCircle, Copy, UserX, Linkedin, CheckCircle2, BarChart3, Heart } from 'lucide-react';

interface LoginProps {}

export const Login: React.FC<LoginProps> = () => {
  const [error, setError] = useState('');
  const [authErrorDomain, setAuthErrorDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // PIX Constants
  const PIX_KEY = "028.268.001-24";
  const PIX_NAME = "Alexandre Magno S. Linhares";

  const handleAuthError = (err: any) => {
    console.error(err);
    let msg = "Erro ao autenticar com o Google.";
    
    if (err.code === 'auth/unauthorized-domain') {
        msg = "Domínio não autorizado pelo Firebase.";
        setAuthErrorDomain(window.location.hostname);
    } else {
        setAuthErrorDomain('');
    }
    
    setError(msg);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAuthErrorDomain('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
      navigator.clipboard.writeText(authErrorDomain);
      alert('Domínio copiado!');
  };

  const copyPix = () => {
      navigator.clipboard.writeText(PIX_KEY);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex font-sans">
      
      {/* LEFT SIDE - LOGIN FORM */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center p-8 md:p-12 lg:p-16 relative overflow-y-auto">
        
        {/* Logo Header */}
        <div className="flex items-center gap-2 mb-10">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
                <Hexagon className="w-6 h-6 text-white" />
            </div>
            <div className="leading-tight">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">NEXO</h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Financial Hub</p>
            </div>
        </div>

        <div className="max-w-sm w-full mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Acesse o Nexo
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Sincronize seus dados com segurança em nuvem usando sua conta Google.
            </p>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 rounded-r-lg flex flex-col gap-1 animate-fade-in">
                   <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                       <AlertCircle className="w-4 h-4" />
                       <span>{error}</span>
                   </div>
                   {authErrorDomain && (
                       <div className="mt-2 pl-6">
                           <p className="text-xs text-slate-600 mb-1">Domínio não autorizado:</p>
                           <code className="text-xs bg-white px-1 py-0.5 rounded border border-rose-200 block mb-2">{authErrorDomain}</code>
                           <button onClick={copyDomain} className="text-xs underline text-rose-600">Copiar Domínio</button>
                       </div>
                   )}
                </div>
            )}

            {/* Google Sign-In button (Large, prominent) */}
            <div className="space-y-4">
                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-slate-700 dark:text-slate-200 text-base active:scale-[0.99] cursor-pointer shadow-sm hover:shadow"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" color="#4285F4"/>
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" color="#34A853"/>
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" color="#FBBC05"/>
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" color="#EA4335"/>
                            </svg>
                            <span>Entrar com o Google</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* SUPPORT / PIX SECTION - EVIDENT STYLE */}
            <div className="mt-12 mb-4">
                <div 
                    onClick={copyPix}
                    className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-4 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 transition-all transform hover:-translate-y-1"
                >
                   <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                       Apoie o Dev ☕
                   </div>

                   <div className="flex items-center gap-4 relative z-0">
                       <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                           <Heart className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-200 dark:fill-indigo-900" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide mb-1">
                               Gostou? Mande um Pix!
                           </p>
                           <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                               <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 truncate select-all">
                                   {PIX_KEY}
                               </p>
                               <span className="text-[9px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-1.5 rounded font-sans font-bold">Chave CPF</span>
                           </div>
                       </div>
                       <div className="text-indigo-300 group-hover:text-indigo-600 transition-colors">
                           {pixCopied ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
                       </div>
                   </div>
                   
                   {/* Tooltip confirmation */}
                   {pixCopied && (
                       <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-sm flex items-center justify-center text-white font-bold rounded-xl animate-fade-in z-20">
                           <div className="flex items-center gap-2">
                               <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                               Chave Pix Copiada!
                           </div>
                       </div>
                   )}
                   <p className="text-[10px] text-slate-400 mt-2 text-center opacity-60 group-hover:opacity-100 transition-opacity">
                      {PIX_NAME}
                   </p>
                </div>
            </div>

            <div className="mt-6 text-center">
                 <a 
                    href="https://www.linkedin.com/in/alemagnobr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
                 >
                    <Linkedin className="w-3 h-3" /> Alexandre Magno
                 </a>
            </div>

        </div>
      </div>

      {/* RIGHT SIDE - VISUALS */}
      <div className="hidden md:flex flex-1 relative bg-[#4c35de] overflow-hidden items-center justify-center p-8">
         {/* Background Shapes */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400 opacity-10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
         
         {/* Decorative Grid */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

         {/* Content Container */}
         <div className="relative z-10 w-full max-w-lg">
            
            {/* Mock Dashboard Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl mb-12 transform hover:scale-[1.02] transition-transform duration-500">
               <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                   <div>
                       <p className="text-white/60 text-xs font-semibold uppercase">Performance Visualisation</p>
                       <p className="text-white text-lg font-bold mt-1">Crescimento Patrimonial</p>
                   </div>
                   <div className="flex gap-2">
                       <div className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-bold">+6.9%</div>
                       <div className="p-1 bg-white/10 rounded text-white/70"><BarChart3 className="w-4 h-4"/></div>
                   </div>
               </div>

               {/* CSS Bar Chart Simulation */}
               <div className="h-48 flex items-end justify-between gap-3 px-2">
                   {[35, 55, 45, 70, 60, 85, 75].map((h, i) => (
                       <div key={i} className="w-full bg-white/10 rounded-t-lg relative group overflow-hidden" style={{height: '100%'}}>
                            <div 
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-400 to-purple-300 rounded-t-lg transition-all duration-1000 group-hover:opacity-90" 
                                style={{ height: `${h}%` }}
                             ></div>
                            {/* Line accent */}
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/30" style={{bottom: `${h}%`}}></div>
                       </div>
                   ))}
               </div>
               <div className="flex justify-between mt-3 text-xs text-white/40 font-medium px-2">
                   <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span>
               </div>
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-3">Bem-vindo ao Nexo</h2>
                <p className="text-indigo-200 text-lg leading-relaxed">
                   Gerencie suas finanças com inteligência, <br/>segurança e clareza total.
                </p>
            </div>
         </div>
         
         {/* Flag/Language Icon Top Right (Mock) */}
         <div className="absolute top-8 right-8">
             <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 text-xl shadow-lg cursor-default">
                 🇧🇷
             </div>
         </div>
      </div>

    </div>
  );
};
