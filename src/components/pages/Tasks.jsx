import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import taskService from "@/services/api/taskService";
import roomService from "@/services/api/roomService";
import ApperIcon from "@/components/ApperIcon";
import FormField from "@/components/molecules/FormField";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Badge from "@/components/atoms/Badge";
import Select from "@/components/atoms/Select";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
roomId: '',
    assignedTo: '',
    priority: 'Medium',
estimatedDuration: '',
    scheduledDate: '',
    status: 'Pending'
  });

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

  useEffect(() => {
    loadTasks();
    loadRooms();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      setTasks(data);
    } catch (error) {
      setError('Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getRoomNumber(task.roomId).toString().includes(searchTerm);
    const matchesFilter = filter === 'all' || task.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
setFormData({
      title: '',
      description: '',
      roomId: '',
      assignedTo: '',
      priority: 'Medium',
      estimatedDuration: '',
      scheduledDate: '',
      status: 'Pending'
    });
  };

  const handleCreateTask = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setFormData({ ...task });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return false;
    }
    if (!formData.assignedTo.trim()) {
      toast.error('Assigned staff member is required');
      return false;
    }
    if (!formData.scheduledDate) {
      toast.error('Scheduled date is required');
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
if (taskToEdit) {
        await taskService.update(taskToEdit.Id, formData);
        toast.success('Task updated successfully!');
        setShowEditModal(false);
        setTaskToEdit(null);
      } else {
        await taskService.create(formData);
        toast.success('Task created successfully!');
        setShowCreateModal(false);
      }
      resetForm();
      loadTasks();
    } catch (error) {
      toast.error(`Failed to ${taskToEdit ? 'update' : 'create'} task`);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await taskService.update(task.Id, { ...task, status: newStatus });
      toast.success(`Task status updated to ${newStatus}!`);
      loadTasks();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    try {
      await taskService.delete(task.Id);
      toast.success('Task deleted successfully!');
      loadTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

const getTaskStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };
const getRoomNumber = (roomId) => {
    const room = rooms.find(r => r.Id === parseInt(roomId));
    return room ? room.number : 'N/A';
  };

  const getRoomDetails = (roomId) => {
    const room = rooms.find(r => r.Id === parseInt(roomId));
    return room ? { number: room.number, type: room.type, status: room.status } : null;
  };

  if (loading) return <Loading message="Loading tasks..." />;
  if (error) return <Error message={error} onRetry={loadTasks} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage housekeeping tasks and assignments</p>
        </div>
        <Button onClick={handleCreateTask} className="btn-gradient">
          <ApperIcon name="Plus" size={16} className="mr-2" />
          Create Task
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search tasks or staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full"
            >
<option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <Empty 
            message="No tasks found" 
            description="Create your first task to get started"
            action={
              <Button onClick={handleCreateTask} className="btn-gradient">
                <ApperIcon name="Plus" size={16} className="mr-2" />
                Create Task
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map(task => (
              <div key={task.Id} className="bg-gray-50 rounded-lg p-4 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 truncate mr-2">{task.title}</h3>
                  <div className="flex gap-1">
                    <Badge variant={getPriorityColor(task.priority)} size="sm">
                      {task.priority}
                    </Badge>
                    <Badge variant={getTaskStatusColor(task.status)} size="sm">
                      {task.status}
                    </Badge>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                )}

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
<ApperIcon name="MapPin" size={14} className="mr-2" />
                    Room {getRoomNumber(task.roomId)}
                    {getRoomDetails(task.roomId)?.status && (
                      <Badge variant={getRoomDetails(task.roomId).status.toLowerCase().replace(' ', '')} size="sm" className="ml-2">
                        {getRoomDetails(task.roomId).status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <ApperIcon name="User" size={14} className="mr-2" />
                    {task.assignedTo}
                  </div>
                  <div className="flex items-center">
                    <ApperIcon name="Calendar" size={14} className="mr-2" />
                    {new Date(task.scheduledDate).toLocaleDateString()}
                  </div>
                  {task.estimatedDuration && (
                    <div className="flex items-center">
                      <ApperIcon name="Clock" size={14} className="mr-2" />
                      {task.estimatedDuration} minutes
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTask(task)}
                    className="flex-1"
                  >
                    <ApperIcon name="Edit" size={12} className="mr-1" />
                    Edit
                  </Button>
{task.status !== 'Completed' && task.status !== 'Cancelled' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusChange(task, 
                        task.status === 'Pending' ? 'In Progress' : 'Completed'
                      )}
                      className="flex-1"
                    >
                      <ApperIcon name="CheckCircle" size={12} className="mr-1" />
                      {task.status === 'Pending' ? 'Start' : 'Complete'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  <ApperIcon name="X" size={16} />
                </Button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Task Title" required>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="e.g., Deep clean room"
                    />
                  </FormField>

                  <FormField label="Assigned To" required>
                    <Input
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleFormChange}
                      placeholder="Staff member name"
                    />
                  </FormField>

<FormField label="Room">
                    <Select
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleFormChange}
                    >
                      <option value="">Select room</option>
                      {rooms.map(room => (
                        <option key={room.Id} value={room.Id}>
                          Room {room.number} - {room.type} ({room.status})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Priority">
                    <Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Scheduled Date" required>
                    <Input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleFormChange}
                    />
                  </FormField>

                  <FormField label="Estimated Duration (minutes)">
                    <Input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleFormChange}
                      placeholder="e.g., 45"
                    />
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows="3"
                    placeholder="Task details and special instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </FormField>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 btn-gradient">
                    Create Task
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(taskToEdit)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <ApperIcon name="Trash2" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(false)}
                  >
                    <ApperIcon name="X" size={16} />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Task Title" required>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="e.g., Deep clean room"
                    />
                  </FormField>

                  <FormField label="Assigned To" required>
                    <Input
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleFormChange}
                      placeholder="Staff member name"
                    />
                  </FormField>

                  <FormField label="Room">
<Select
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleFormChange}
                    >
                      <option value="">Select room</option>
                      {rooms.map(room => (
                        <option key={room.Id} value={room.Id}>
                          Room {room.number} - {room.type} ({room.status})
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Priority">
                    <Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Status">
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Scheduled Date" required>
                    <Input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleFormChange}
                    />
                  </FormField>

                  <FormField label="Estimated Duration (minutes)">
                    <Input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleFormChange}
                      placeholder="e.g., 45"
                    />
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows="3"
                    placeholder="Task details and special instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </FormField>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 btn-gradient">
                    Update Task
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;