import React, { useState } from 'react';
import { View } from '../App';

interface TermsPageProps {
  setView: (view: View) => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ setView }) => {
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: ''
  });

  const handleContinue = () => {
    if (agreed) {
      setShowModal(true);
    } else {
      alert("Por favor, acepta los términos y condiciones para continuar.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.company && formData.email) {
      setIsSubmitting(true);
      try {
        const response = await fetch("https://formspree.io/f/mvzrrpwr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            nombreCompleto: formData.fullName,
            empresa: formData.company,
            email: formData.email,
            _subject: `Nueva aceptación de términos: ${formData.company}`,
            _message: `${formData.fullName} ha aceptado los términos y condiciones.`
          }),
        });

        if (response.ok) {
          setShowModal(false);
          setView('landing');
          alert("¡Registro completado con éxito! Gracias por aceptar nuestros términos.");
        } else {
          alert("Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error de conexión. Por favor verifica tu internet e intenta nuevamente.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="bg-[#f6f6f8] font-display text-slate-900 transition-colors duration-200 min-h-screen flex flex-col relative">
      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 pt-[130px] pb-4 md:pb-8 lg:pb-12">
        {/* Page Heading */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 text-[#212147]">Términos de Servicio</h1>
          <p className="text-slate-600 text-lg">
            SOPORTE TÉCNICO CONTAPYME / AGROWIN. Última actualización: <span className="font-medium text-slate-800">29 de Enero, 2026</span>
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 h-auto lg:h-[calc(100vh-350px)] min-h-[600px]">
          {/* Left Column: Highlights (Sticky) */}
          <div className="lg:w-5/12 xl:w-1/3 flex flex-col gap-6">
            <div className="mb-2">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#212147]">
                <span className="material-symbols-outlined text-[#212147]">verified</span>
                Puntos Clave
              </h2>
              <p className="text-slate-600 mb-6">
                Resumen de los términos para el servicio de soporte técnico de ContaPyme y AgroWin.
              </p>
            </div>

            <div className="grid gap-4 overflow-y-auto pr-2 pb-4">
              {/* Highlight Card 1 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-[#212147]/30 group">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-[#212147] group-hover:bg-[#212147] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-[#212147]">Cobertura de Soporte</h3>
                    <p className="text-sm text-black leading-relaxed">
                      Atención de inquietudes, revisión de bases de datos y errores. <span className="block mt-1 font-medium italic text-slate-600 border-l-2 border-[#212147]/20 pl-2 text-xs">El soporte técnico no cubre capacitación y/o asesoría en montaje sobre módulos del software.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlight Card 2 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-[#212147]/30 group">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-[#212147]">Sistema de Tiquetes</h3>
                    <p className="text-sm text-black leading-relaxed">
                      Las solicitudes se controlan mediante tiquetes con prioridad asignada según la afectación del cliente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlight Card 3 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-[#212147]/30 group">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">timer</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-[#212147]">Tiempos de Respuesta</h3>
                    <p className="text-sm text-black leading-relaxed">
                      Primera atención promedio en 1 día hábil. Solución definitiva en promedio 7 días hábiles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Full Legal Text (Scrollable) */}
          <div className="lg:w-7/12 xl:w-2/3 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Documento de Términos del Servicio</span>
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-slate-200 rounded text-slate-500" title="Imprimir" onClick={() => window.print()}>
                  <span className="material-symbols-outlined text-[20px]">print</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 legal-scroll">
              <article className="prose prose-slate max-w-none">
                <h2 className="text-xl font-bold text-[#212147] mt-0 mb-6 uppercase">TÉRMINOS Y CONDICIONES DEL SERVICIO DE SOPORTE TÉCNICO CONTAPYME / AGROWIN</h2>
                
                <p className="text-slate-700 mb-8 font-medium">El presente documento aclara los términos bajo los cuales se solicita servicio de soporte técnico de ContaPyme / AgroWin.</p>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">A. COBERTURA DEL SOPORTE TÉCNICO:</h3>
                  <p className="text-slate-700 mb-4">El soporte técnico ofrecido cubre los siguientes servicios:</p>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>Atención de inquietudes especificas acerca de la configuración y/o funcionamiento del software ContaPyme® y AgroWin® que no estén documentadas.</li>
                    <li>Revisión de la base de datos del software para la verificación de inconsistencias presentadas.</li>
                    <li>Recepción y verificación de reportes de errores del software.</li>
                    <li>Recepción y trámite de solicitudes de servicios electrónicos.</li>
                    <li>Recepción de solicitudes de mejoras y nuevos desarrollos del software.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">B. SERVICIOS NO CUBIERTOS POR EL SOPORTE TÉCNICO:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3 font-normal">
                    <li>El soporte técnico no cubre capacitación y/o asesoría en montaje sobre módulos del software.</li>
                    <li>InSoft proporciona una plataforma de capacitación virtual interactiva, la cual estará disponible de manera gratuita durante la vigencia de la póliza de actualizaciones, soporte y mantenimiento. Esta permite obtener un conocimiento operativo básico del software.</li>
                    <li>El cliente puede contratar los servicios de capacitación y/o asesoría en montaje de forma independiente y a las tarifas establecidas por el distribuidor.</li>
                    <li>El servicio de capacitación y asesoría en montaje debe ser cotizado, pagado y programado con suficiente anticipación ya que depende de la disponibilidad de los asesores de soporte.</li>
                    <li>Las solicitudes de capacitación y asesoría sean virtuales o presenciales se deben programar con un mínimo de 15 días de anticipación y se programan máximo 2 sesiones a la semana, con una duración por sesión de máximo 2 horas. La fecha y hora de inicio de las sesiones está sujeta a la disponibilidad de los asesores.</li>
                    <li>El soporte técnico no cubre soporte sobre equipos de cómputo, redes, servicio de internet y demás infraestructura del Cliente.</li>
                    <li>El servicio de soporte técnico sobre equipos de cómputo e infraestructura debe ser contratado por el cliente con un proveedor independiente.</li>
                    <li>Servicios de ingeniería especializados, como API, integraciones con otras bases de datos, desarrollo de informes y reportes a la medida, entre otros. Esos servicios debe contratarlos el cliente de forma directa con InSoft.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">C. METODOLOGÍA DE PRESTACIÓN DEL SERVICIO DE SOPORTE TÉCNICO:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>Las solicitudes de soporte técnico se controlan a través de un sistema de tiquetes.</li>
                    <li>Los tiquetes de soporte técnico son asignados al distribuidor encargado de la atención del cliente.</li>
                    <li>El cliente debe solicitar los tiquetes, a través del software ContaPyme®, AgroWin® o mediante el Portal de Clientes ContaPyme®.</li>
                    <li>La asignación de tiquetes se realiza en orden a las solicitudes de los clientes.</li>
                    <li>Para agilizar la atención del tiquete, se recomienda al cliente notificar por whatsapp al contacto 311 601 7270 sobre el tiquete que ha solicitado.</li>
                    <li>Los tiquetes relacionados con temas de licenciamiento, pasword de registro de licencias, contratación de servicios electrónicos, cesión de licencias, entre otros temas de manejo particular de InSoft, serán revisados inicialmente por el distribuidor pero remitidos a InSoft para su atención.</li>
                    <li>El cliente puede solicitar tiquetes para las inquietudes puntuales presente, sobre diferentes temas del software.</li>
                    <li>A cada tiquete se le asigna una prioridad de atención según el nivel de afectación que tiene el cliente.</li>
                    <li>Los tiquetes se atienden según la prioridad y el orden de asignación.</li>
                    <li>El asesor encargado de atender el tiquete se comunicará con el cliente para atender su solicitud.</li>
                    <li>Durante la prestación del servicio, el asesor tendrá acceso a la información del cliente y podrá realizar las acciones y configuraciones necesarias para la solución de la solicitud, es responsabilidad del cliente garantizar que la información expuesta y las acciones realizadas están autorizadas por él.</li>
                    <li>En caso de requerir una revisión más profunda, el asesor podrá solicitar una copia de seguridad del área de trabajo a revisar, en ese caso y para salvaguardar la seguridad de información del cliente, este podrá generar una copia especial donde se disfrazan los datos con el fin de no entregar información confidencial.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">D. REQUISITOS PARA LA SOLICITUD DE SOPORTE TÉCNICO:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>La póliza de actualizaciones, soporte y mantenimiento debe estar vigente a la fecha de solicitud del servicio.</li>
                    <li>Se suministrará soporte técnico al contacto con perfil soporte que haya surtido el proceso de capacitación mínima recomendada. Este proceso se puede hacer de manera gratuita a través de la plataforma de capacitación virtual interactiva o con costo a través del distribuidor autorizado.</li>
                    <li>El software debe tener instalada la actualización más reciente, que puede verificarla ingresando al portal de clientes (www.contapyme.com/portal-clientes), opción “Actualizaciones”.</li>
                    <li>Tener instalado el sistema de conexión a escritorio remoto AnyDesk, el cual puede descargar desde el portal de clientes (www.contapyme.com/portal-clientes), Menú “Instaladores”, “Otros programas”.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">E. MEDIOS PARA LA SOLICITUD DE SOPORTE TÉCNICO:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>Directamente desde el software ContaPyme® y AgroWin®: Es el principal medio utilizado para la solicitud de soporte técnico ya que de forma directa y sin demoras el cliente puede solicitar un tiquete de soporte técnico. Este medio requiere conexión a Internet.</li>
                    <li>Desde el Portal de clientes: Ingresando al portal de clientes (www.contapyme.com/portal-clientes), opción “Soporte técnico”, “Mis tiquetes”. Este medio requiere conexión a Internet.</li>
                    <li>Para agilizar la atención del tiquete, se recomienda al cliente notificar por whatsapp al contacto 311 601 7270 sobre el tiquete que ha solicitado.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">F. MEDIOS UTILIZADOS PARA LA PRESTACIÓN DEL SOPORTE TÉCNICO:</h3>
                  <p className="text-slate-700 mb-4">Para la prestación del servicio de soporte técnico el asesor asignado puede utilizar los siguientes medios:</p>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>Asistencia remota: Permite al asesor tomar el control del computador del cliente de manera remota, utilizando el sistema de conexión a escritorio remoto utilizado por InSoft (AnyDesk) Este medio requiere conexión a Internet.</li>
                    <li>Telefónicamente: En caso de tiquetes de baja complejidad se puede a través de este medio, indicar al cliente una posible solución.</li>
                    <li>WhatsApp: Permite al asesor orientar al cliente sobre consultas rápidas o solicitar o enviar información para la conexión por otro medio. El número registrado para este fin es 311 601 7270.</li>
                    <li>Sesión por Meet: Cuando hay inquietudes sobre diversos temas se puede programar una reunión a través del Meet en una fecha y hora especifica para atender dichos temas. Estas sesiones se graban y se envía el video al cliente para su posterior consulta.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">G. HORARIO DE ATENCIÓN DE SOPORTE TÉCNICO:</h3>
                  <p className="text-slate-700 mb-4">El servicio de soporte técnico podrá ser solicitado en cualquier momento del día y los asesores atenderán dichas solicitudes en los siguientes horarios:</p>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li><strong>Lunes a viernes:</strong> 8:00 am a 12:00 pm y de 2:00 pm a 6:00 pm. Hora de Colombia (GMT -5).</li>
                    <li><strong>Sábados:</strong> 8:00 am a 12:00 pm. Hora de Colombia (GMT -5).</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">H. SEGUIMIENTO DE TIQUETES:</h3>
                  <p className="text-slate-700">El cliente puede realizar seguimiento a sus tiquetes de soporte técnico directamente desde el software ContaPyme® y AgroWin® o desde el portal de clientes (www.contapyme.com/portal-clientes), opción “Soporte técnico”, “Mis tiquetes”.</p>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">I. TIEMPOS DE RESPUESTA:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>Los tiempos de respuesta para la atención de los tiquetes depende de la demanda de tiquetes, de su conplejidad y de la cantidad de tiquetes de asesores disponibles para la atención.</li>
                    <li>El tiempo de respuesta para la primera atención es en promedio 1 día hábil.</li>
                    <li>El tiempo de respuesta para la solución de un tiquete es en promedio 7 días hábiles.</li>
                    <li>En algunas ocasiones los tiempos de respuesta pueden extenderse por encima del promedio establecido.</li>
                    <li>En casos como corrección de errores o nuevas adiciones es posible que sea necesario esperar la liberación de una nueva actualización del software.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">J. REPORTE DE ERRORES Y PRESENTACIÓN DE SOLICITUDES DE MEJORAS Y NUEVOS DESARROLLOS:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>Se clasifica como “Error” cuando una funcionalidad ya incluida en el software está realizando cálculos o presentando información que no es correcta.</li>
                    <li>No se considera como error opciones o configuraciones no incluidas en el software.</li>
                    <li>Los errores se atienden según el grado de afectación que tenga el cliente, pero generalmente se atienden con prioridad máxima.</li>
                    <li>Todo error deberá ser presentado a través de un tiquete de soporte.</li>
                    <li>El asesor que atiende el tiquete con el reporte de error deberá realizar las validaciones previas y gestionar un tiquete de PQR para reportarlo a InSoft para su atención.</li>
                    <li>El tiquete original será marcado como PQR y reportado por email al cliente.</li>
                    <li>El asesor reportará al cliente cuando el error haya sido corregido.</li>
                    <li>Se clasifica como “Mejora” cuando una funcionalidad ya desarrollada en el software puede incluir nuevas opciones o configuraciones.</li>
                    <li>Se clasifica como “Nuevo desarrollo” cuando el cliente requiere una nueva funcionalidad que debe ser desarrollada desde cero.</li>
                    <li>Toda solicitud de mejora y/o nuevo desarrollo para el software deberá ser presentado a través de un tiquete de soporte.</li>
                    <li>En caso de mejoras y/o nuevos desarrollos el asesor solicitará al cliente el diligenciamiento del formato para propuesta de mejora-adición dispuesto por InSoft.</li>
                    <li>La recepción de las solicitudes de mejora y/o nuevos desarrollos NO establecen compromiso por parte de InSoft de que estas serán implementadas.</li>
                    <li>InSoft recibe la solicitud de mejora y/o nuevo desarrollo y presentará dicha solicitud al comité de ingeniería para su evaluación.</li>
                    <li>El comité de ingeniería se reúne periódicamente para evaluar la viabilidad de las solicitudes de mejora y/o nuevos desarrollos según su prioridad y cobertura.</li>
                    <li>Algunos desarrollos tienen costo para el cliente.</li>
                    <li>El asesor que recibió la solicitud de mejora y/o nuevos desarrollos informará al cliente de forma escrita la decisión tomada por el comité de ingeniería.</li>
                    <li>Las solicitudes de mejora y/o nuevo de desarrollo que son aprobadas no necesariamente son incluidas en las próximas actualizaciones realizadas al software.</li>
                  </ul>
                </section>

                <section className="mb-10">
                  <h3 className="text-lg font-bold text-[#212147] mb-4">K. CALIFICACIÓN DEL SERVICIO DE SOPORTE TÉCNICO:</h3>
                  <ul className="list-disc pl-6 mb-6 text-slate-700 space-y-3">
                    <li>El cliente debe calificar la atención que ha recibido una vez el tiquete sea cerrado.</li>
                    <li>La calificación del tiquete puede hacerla directamente desde el software ContaPyme® y AgroWin® o a través de la página www.contapyme.com/portal-clientes, opción “Soporte técnico”, “Mis tiquetes”.</li>
                    <li>En caso de que el cliente presente una queja o inconformidad por el servicio de soporte técnico recibido, debe informarla al momento de realizar la calificación del tiquete o enviando un correo al área de auditoría de InSoft: auditoria@contapyme.com.</li>
                    <li>Cada queja o inconformidad será evaluada para determinar si se ha presentado incumplimiento de los términos y condiciones establecidos para la prestación de los servicios ofrecidos.</li>
                  </ul>
                </section>

                <p className="text-sm text-slate-500 italic mt-8 border-t border-slate-100 pt-6">
                  Fin del Acuerdo. ContaPyme y AgroWin son marcas registradas de InSoft.
                </p>
              </article>
            </div>
            {/* Sticky Action Footer within Legal Box */}
            <div className="p-6 border-t border-slate-100 bg-white backdrop-blur">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white checked:bg-[#212147] checked:border-[#212147] focus:ring-4 focus:ring-[#212147]/20 transition-all font-bold"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-base opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity font-bold">check</span>
                  </div>
                  <span className="text-slate-700 font-medium group-hover:text-[#212147] transition-colors">He leído y acepto los Términos y Condiciones</span>
                </label>
                <button
                  onClick={handleContinue}
                  className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    agreed
                      ? 'bg-[#212147] hover:bg-[#212147]/90 text-white shadow-[#212147]/20'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                  disabled={!agreed}
                >
                  <span>Continuar</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#212147] p-6 text-white text-center">
              <h2 className="text-2xl font-bold mb-1">Registro de Aceptación</h2>
              <p className="text-blue-100 text-sm opacity-80">Por favor completa tus datos para finalizar</p>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-sm font-semibold text-slate-700 ml-1">Nombre Completo</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#212147] transition-colors">person</span>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#212147] focus:ring-4 focus:ring-[#212147]/10 transition-all text-slate-800 disabled:opacity-50"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label htmlFor="company" className="text-sm font-semibold text-slate-700 ml-1">Nombre de la empresa</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#212147] transition-colors">business</span>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      placeholder="Nombre de tu organización"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#212147] focus:ring-4 focus:ring-[#212147]/10 transition-all text-slate-800 disabled:opacity-50"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700 ml-1">Correo electrónico</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#212147] transition-colors">mail</span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="usuario@empresa.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#212147] focus:ring-4 focus:ring-[#212147]/10 transition-all text-slate-800 disabled:opacity-50"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#212147] hover:bg-[#212147]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#212147]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar y Finalizar</span>
                      <span className="material-symbols-outlined text-sm">send</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsPage;
