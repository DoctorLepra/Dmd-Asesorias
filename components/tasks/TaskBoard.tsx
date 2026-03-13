"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Profile } from "../../App";
import { createNotification } from "../notifications/NotificationBell";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: "Pendiente" | "Completada" | "Cancelada";
  assigned_to_name: string;
  assigned_to_id?: string;
  entity_id?: string;
  created_by_id?: string;
  created_at?: string;
}

interface TaskBoardProps {
  entityId?: string; // Filtrar tareas por una entidad específica
  profile: Profile;
  highlightId?: string | null;
  onHighlightComplete?: () => void;
}

export default function TaskBoard({ entityId, profile, highlightId, onHighlightComplete }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendiente' | 'Completada' | 'Cancelada'>('Todos');
  const [userFilter, setUserFilter] = useState<string>('Todos');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    assigned_to_name: "",
    assigned_to_id: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    const cleanup = subscribeToTasks();
    return () => {
      if (cleanup) cleanup();
    };
  }, [entityId]);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, userFilter]);

  // Efecto para manejar el resaltado desde notificaciones
  useEffect(() => {
    if (highlightId) {
      console.log(`[TaskBoard] Highlighting task: ${highlightId}`);
      setActiveHighlight(highlightId);
      
      // Hacer scroll hacia la tarea si existe en el DOM
      setTimeout(() => {
        const element = document.getElementById(`task-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      const timer = setTimeout(() => {
        setActiveHighlight(null);
        if (onHighlightComplete) onHighlightComplete();
      }, 3000); // 3 segundos como solicitó el usuario

      return () => clearTimeout(timer);
    }
  }, [highlightId, onHighlightComplete]);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    // Regla de Visibilidad: Si no es Admin, solo ve lo que creó o lo que tiene asignado
    if (profile.role !== 'ADMINISTRATOR') {
      query = query.or(`created_by_id.eq.${user.id},assigned_to_id.eq.${user.id}`);
    }

    const { data } = await query;
    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      // Usamos el RPC que ya está configurado en el sistema para obtener todos los usuarios
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error("Error fetching users via RPC:", error);
        // Fallback al select directo si el RPC falla
        const { data: directData } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .order("full_name");
        if (directData) {
            filterAndSetUsers(directData);
        }
        return;
      }

      if (data) {
        filterAndSetUsers(data);
      }
    } catch (err) {
      console.error("Critical error fetching users:", err);
    }
  };

  const filterAndSetUsers = (userData: any[]) => {
    // Si no soy Administrador, solo puedo ver y asignar tareas a usuarios no administradores
    if (profile.role !== 'ADMINISTRATOR') {
      const filteredUsers = userData.filter(u => u.role !== 'ADMINISTRATOR');
      setUsers(filteredUsers);
    } else {
      // Como Administrador, puedo ver a todos en los filtros para supervisión
      setUsers(userData);
    }
  }

  const subscribeToTasks = () => {
    const filter = entityId ? `entity_id=eq.${entityId}` : undefined;

    const channel = supabase
      .channel("realtime-tasks")
      .on(
        "postgres_changes",
        { event: "*", table: "tasks", schema: "public", filter },
        (payload) => {
          // Guarda de seguridad para tiempo real: los no-admin solo procesan lo propio
          const task = (payload.new || payload.old) as Task;
          if (profile.role !== 'ADMINISTRATOR' && currentUser) {
            const isOwnTask = task.created_by_id === currentUser.id || task.assigned_to_id === currentUser.id;
            if (!isOwnTask) return;
          }

          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            setTasks((prev) =>
              [newTask, ...prev].sort(
                (a, b) =>
                  new Date(b.created_at || "").getTime() -
                  new Date(a.created_at || "").getTime()
              ),
            );
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setFormData({
      title: task.title,
      description: task.description,
      due_date: task.due_date ? task.due_date.split("T")[0] : new Date().toISOString().split("T")[0],
      assigned_to_name: task.assigned_to_name,
      assigned_to_id: task.assigned_to_id || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null);
    setFormData({
      title: "",
      description: "",
      due_date: new Date().toISOString().split("T")[0],
      assigned_to_name: "",
      assigned_to_id: "",
    });
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const taskData = {
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date,
      assigned_to_name: formData.assigned_to_name,
      assigned_to_id: formData.assigned_to_id || null,
      entity_id: entityId,
      created_by_id: taskToEdit ? taskToEdit.created_by_id : user?.id,
      status: taskToEdit ? taskToEdit.status : "Pendiente",
    };

    let result;
    if (taskToEdit) {
      result = await supabase.from("tasks").update(taskData).eq("id", taskToEdit.id).select();
    } else {
      result = await supabase.from("tasks").insert([taskData]).select();
    }

    const { data, error } = result;

    if (!error && data && data[0]) {
      // Si es una nueva tarea y hay un usuario asignado, enviarle una notificación
      if (!taskToEdit && formData.assigned_to_id) {
        await createNotification({
          user_id: formData.assigned_to_id,
          title: "Nueva Tarea Asignada",
          message: `${profile.full_name} te ha asignado la tarea: ${formData.title}. Fecha límite: ${formData.due_date}`,
          type: "task",
          related_id: data[0].id
        });
      }

      closeModal();
    }
  };

  const updateStatus = async (id: string, status: Task["status"]) => {
    // 1. Obtener detalles y estado actual de la tarea antes de actualizar
    const { data: taskData } = await supabase
      .from("tasks")
      .select("title, created_by_id, assigned_to_name, status")
      .eq("id", id)
      .single();

    // Validar que la tarea no esté ya finalizada
    if (taskData?.status === "Completada" || taskData?.status === "Cancelada") {
      console.warn("Intento de cambiar estado en tarea ya finalizada");
      return;
    }

    // 2. Actualizar el estado
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);

    if (!error && taskData && taskData.created_by_id) {
       // 3. Notificar al creador (asignador) que la tarea cambió de estado
       const { data: { user } } = await supabase.auth.getUser();
       if (user && user.id !== taskData.created_by_id) {
         await createNotification({
           user_id: taskData.created_by_id,
           title: `Tarea ${status}`,
           message: `${taskData.assigned_to_name} ha marcado como '${status}' la tarea: ${taskData.title}`,
           type: "task",
           related_id: id
         });
       }
    }
  };

  const counts = {
    Pendiente: tasks.filter(t => t.status === 'Pendiente').length,
    Completada: tasks.filter(t => t.status === 'Completada').length,
    Cancelada: tasks.filter(t => t.status === 'Cancelada').length,
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
    const matchesUser = userFilter === 'Todos' || t.assigned_to_id === userFilter;
    return matchesStatus && matchesUser;
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden font-sans">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestión de Tareas</h2>
          <p className="text-sm text-slate-500">Actividades y seguimiento en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Botón Unificado de Filtros */}
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border shadow-sm active:scale-95 ${
                statusFilter !== 'Todos' || userFilter !== 'Todos'
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              Filtros
              {(statusFilter !== 'Todos' || userFilter !== 'Todos') && (
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              )}
            </button>

            {/* Menú Desplegable de Filtros */}
            {isFilterMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={() => setIsFilterMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Ver Tareas</h4>
                      <button 
                        onClick={() => {
                          setStatusFilter('Todos');
                          setUserFilter('Todos');
                          setIsFilterMenuOpen(false);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Limpiar Todo
                      </button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estado</label>
                       <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                        >
                          <option value="Todos">Todos los Estados</option>
                          <option value="Pendiente">Solo Pendientes</option>
                          <option value="Completada">Solo Completadas</option>
                          <option value="Cancelada">Solo Canceladas</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Responsable</label>
                       <select
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                        >
                          <option value="Todos">Todos los Responsables</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.full_name}
                            </option>
                          ))}
                        </select>
                    </div>

                    <button
                      onClick={() => setIsFilterMenuOpen(false)}
                      className="w-full mt-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Mini Dashboard de Estados */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-50">
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pendientes</p>
                <h4 className="text-2xl font-black text-amber-700 leading-tight">{counts.Pendiente}</h4>
            </div>
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined">pending_actions</span>
            </div>
        </div>
        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Completadas</p>
                <h4 className="text-2xl font-black text-green-700 leading-tight">{counts.Completada}</h4>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined">task_alt</span>
            </div>
        </div>
        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Canceladas</p>
                <h4 className="text-2xl font-black text-red-700 leading-tight">{counts.Cancelada}</h4>
            </div>
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <span className="material-symbols-outlined">cancel</span>
            </div>
        </div>
      </div>

      <div className="p-6 min-h-[200px] bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Cargando tareas...</span>
          </div>
        ) : paginatedTasks.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <div className="bg-white p-4 rounded-full text-slate-200 border border-slate-100 shadow-inner">
               <span className="material-symbols-outlined text-4xl">inventory_2</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              No hay tareas con el estado "{statusFilter}"
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedTasks.map((task) => (
                <div
                  key={task.id}
                  id={`task-${task.id}`}
                  className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border-2 transition-all duration-500 gap-4 ${
                      activeHighlight === task.id 
                      ? 'border-blue-500 bg-blue-50/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                      : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-primary/20 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex-1">
                    <h3
                      className={`font-bold text-slate-800 transition-all ${task.status === "Completada" ? "line-through text-slate-400 opacity-60" : ""}`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {task.due_date ? task.due_date.split('T')[0].split('-').reverse().join('/') : 'Sin fecha'}
                      </div>
                      {task.assigned_to_name && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {task.assigned_to_name}
                        </div>
                      )}
                      <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          task.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 
                          task.status === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                          {task.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {task.status === "Pendiente" && (
                      <>
                        {/* Botón de Editar: Solo creador y Pendiente */}
                        {task.created_by_id === currentUser?.id && (
                          <button
                            onClick={() => openEditModal(task)}
                            title="Editar tarea"
                            className="flex-1 sm:flex-none p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        )}

                        <button
                          onClick={() => updateStatus(task.id, "Completada")}
                          title="Marcar como completada"
                          className="flex-1 sm:flex-none p-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                        
                        <button
                            onClick={() => updateStatus(task.id, "Cancelada")}
                            title="Cancelar tarea"
                            className="flex-1 sm:flex-none p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined">cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === page 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                    {taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Presentar reporte mensual"
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Detalles adicionales..."
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium h-28 resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Responsable
                  </label>
                  <select
                    required
                    className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium"
                    value={formData.assigned_to_id}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      setFormData({
                        ...formData,
                        assigned_to_id: e.target.value,
                        assigned_to_name: selectedUser?.full_name || "",
                      });
                    }}
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {users
                      .filter(u => u.role !== 'ADMINISTRATOR')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role === 'ADMINISTRATOR' ? 'Adm' : 'Edi'})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  {taskToEdit ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
