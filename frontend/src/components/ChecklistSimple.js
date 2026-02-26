import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2, Plus, X, Edit2, Check } from 'lucide-react';
import { getChecklistTasks, toggleChecklistTask, createChecklistTask, deleteChecklistTask, updateChecklistTask } from '@/lib/supabase';
import { toast } from 'sonner';

const ChecklistSimple = ({ patientId, isPatientView = true }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadTasks();
  }, [patientId]);

  const loadTasks = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await getChecklistTasks(patientId);
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId, currentCompleted) => {
    try {
      const { error } = await toggleChecklistTask(taskId, !currentCompleted);
      if (error) throw error;
      
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, completed: !currentCompleted } : t
      ));
      toast.success(!currentCompleted ? 'Tarefa concluída!' : 'Tarefa desmarcada');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setAdding(true);
    try {
      const { data, error } = await createChecklistTask(patientId, newTaskTitle.trim());
      if (error) throw error;
      
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      toast.success('Tarefa criada!');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const { error } = await deleteChecklistTask(taskId);
      if (error) throw error;
      
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Tarefa excluída');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleSaveEdit = async (taskId) => {
    if (!editTitle.trim()) {
      toast.error('Título não pode ser vazio');
      return;
    }

    try {
      const { data, error } = await updateChecklistTask(taskId, { title: editTitle.trim() });
      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? data : t));
      setEditingId(null);
      setEditTitle('');
      toast.success('Tarefa atualizada');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="checklist-simple">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Checklist Diário</span>
          {tasks.length > 0 && (
            <span className="text-sm font-normal text-gray-600">
              {completedCount}/{tasks.length} ({progress}%)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Barra de progresso */}
        {tasks.length > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teal-700 h-2 rounded-full transition-all" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de tarefas */}
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">
              {isPatientView 
                ? 'Seu profissional ainda não configurou seu checklist.' 
                : 'Nenhuma tarefa criada ainda.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg group"
                data-testid={`task-${task.id}`}
              >
                <button
                  onClick={() => handleToggle(task.id, task.completed)}
                  className="flex-shrink-0"
                  data-testid={`task-toggle-${task.id}`}
                  disabled={!isPatientView}
                >
                  {task.completed ? (
                    <CheckCircle2 className="text-green-600" size={24} />
                  ) : (
                    <Circle className="text-gray-400" size={24} />
                  )}
                </button>
                
                {editingId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-teal-700 rounded focus:outline-none focus:ring-2 focus:ring-teal-700"
                      data-testid={`task-edit-input-${task.id}`}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(task.id)}
                      className="text-green-600 hover:text-green-700"
                      data-testid={`task-save-${task.id}`}
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-500 hover:text-gray-700"
                      data-testid={`task-cancel-${task.id}`}
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <span 
                      className={`flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}
                    >
                      {task.title}
                    </span>

                    {!isPatientView && (
                      <>
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 hover:text-teal-700"
                          data-testid={`task-edit-${task.id}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                          data-testid={`task-delete-${task.id}`}
                        >
                          <X size={20} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulário para adicionar (apenas profissional) */}
        {!isPatientView && (
          <form onSubmit={handleAdd} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nova tarefa..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              disabled={adding}
              data-testid="new-task-input"
            />
            <button
              type="submit"
              disabled={adding || !newTaskTitle.trim()}
              className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              data-testid="add-task-button"
            >
              <Plus size={20} />
              Adicionar
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ChecklistSimple;
