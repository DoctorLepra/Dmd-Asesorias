"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

/*
-- ESQUEMA SQL SUGERIDO PARA SUPABASE (Ejecutar en el editor SQL)
-- 
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Completada', 'Cancelada'
    assigned_to_name TEXT,
    entity_id TEXT, -- Opcional: Para filtrar por evento/proyecto
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Realtime para esta tabla
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
*/

// --- CONFIGURACIÓN DEL CLIENTE (Ajustar según tu proyecto) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: "Pendiente" | "Completada" | "Cancelada";
  assigned_to_name: string;
  entity_id?: string;
}

interface TaskBoardProps {
  entityId?: string; // Filtrar tareas por una entidad específica
}

export default function TaskBoard({ entityId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    assigned_to_name: "",
  });

  useEffect(() => {
    fetchTasks();
    const cleanup = subscribeToTasks();
    return () => {
      cleanup();
    };
  }, [entityId]);

  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true });

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    const { data } = await query;
    if (data) setTasks(data);
    setLoading(false);
  };

  const subscribeToTasks = () => {
    const filter = entityId ? `entity_id=eq.${entityId}` : undefined;

    const channel = supabase
      .channel("realtime-tasks")
      .on(
        "postgres_changes",
        { event: "*", table: "tasks", schema: "public", filter },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            setTasks((prev) =>
              [...prev, newTask].sort(
                (a, b) =>
                  new Date(a.due_date).getTime() -
                  new Date(b.due_date).getTime(),
              ),
            );
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const newTask = {
      ...formData,
      entity_id: entityId,
      created_by_id: user?.id,
      status: "Pendiente",
    };

    const { error } = await supabase.from("tasks").insert([newTask]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        due_date: new Date().toISOString().split("T")[0],
        assigned_to_name: "",
      });
    }
  };

  const updateStatus = async (id: string, status: Task["status"]) => {
    await supabase.from("tasks").update({ status }).eq("id", id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-sans">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Tareas</h2>
          <p className="text-sm text-gray-500">Actividades en tiempo real.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 transition-all flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nueva Tarea
        </button>
      </div>

      <div className="p-6 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Cargando tareas...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <div className="bg-gray-50 p-4 rounded-full text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              No hay tareas pendientes
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex-1">
                  <h3
                    className={`font-bold text-gray-900 transition-all ${task.status === "Completada" ? "line-through text-gray-400 opacity-60" : ""}`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                    {task.assigned_to_name && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {task.assigned_to_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status === "Pendiente" && (
                    <button
                      onClick={() => updateStatus(task.id, "Completada")}
                      title="Marcar como completada"
                      className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all hover:scale-105 active:scale-95"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(task.id, "Cancelada")}
                    title="Cancelar tarea"
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all hover:scale-105 active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Nueva Tarea
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Presentar reporte mensual"
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Detalles adicionales..."
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium h-28 resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre..."
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    value={formData.assigned_to_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assigned_to_name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 transition-all shadow-lg active:scale-95"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
