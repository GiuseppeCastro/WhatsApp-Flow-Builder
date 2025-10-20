'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Flow } from '../types/schemas';
import { api } from '@/lib/api';
import { toast } from '@/lib/toasts';

export default function HomePage(): JSX.Element {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadFlows();
  }, []);

  async function loadFlows(): Promise<void> {
    try {
      const data = await api.getAllFlows();
      setFlows(data);
    } catch (error) {
      toast.error('Failed to load flows');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFlow(): Promise<void> {
    const name = prompt('Enter flow name:');
    if (!name) return;

    setCreating(true);
    try {
      const newFlow = await api.createFlow(name);
      toast.success('Flow created');
      router.push(`/builder/${newFlow.id}`);
    } catch (error) {
      toast.error('Failed to create flow');
      console.error(error);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Delete this flow?')) return;

    try {
      await api.deleteFlow(id);
      toast.success('Flow deleted');
      loadFlows();
    } catch (error) {
      toast.error('Failed to delete flow');
      console.error(error);
    }
  }

  async function handleCreateFromTemplate(templateName: string): Promise<void> {
    setCreating(true);
    try {
      const newFlow = await api.createFlow(`${templateName} (Copy)`);
      
      // Load template data
      const templatePath = `/templates/${templateName}.json`;
      const response = await fetch(templatePath);
      const templateData = await response.json();
      
      // Update the flow with template data
      await api.updateFlow(newFlow.id, {
        nodes: templateData.nodes,
        edges: templateData.edges,
      });
      
      toast.success('Flow created from template');
      router.push(`/builder/${newFlow.id}`);
    } catch (error) {
      toast.error('Failed to create flow from template');
      console.error(error);
    } finally {
      setCreating(false);
    }
  }

  const templates = [
    {
      id: 'order-confirmation-flow',
      name: 'Order Confirmation Flow',
      description: 'Sends a confirmation message when a new order is placed and adds a note to the order',
      icon: '📦',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      id: 'customer-engagement-flow',
      name: 'Customer Engagement Flow',
      description: 'Sends a personalized welcome message to new customers, waits 2 days, then sends a follow-up based on order status',
      icon: '🎊',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    },
    {
      id: 'abandoned-cart-recovery',
      name: 'Abandoned Cart Recovery Flow',
      description: 'Recovers abandoned checkouts with conditional logic - sends discount if cart value is high, otherwise sends reminder',
      icon: '🛒',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Flow Builder</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {showTemplates ? 'Hide Templates' : 'Browse Templates'}
            </button>
            <button
              onClick={handleCreateFlow}
              disabled={creating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {creating ? 'Creating...' : '+ Create Flow'}
            </button>
          </div>
        </div>

        {/* Templates Section */}
        {showTemplates && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Flow Templates</h2>
              <span className="text-sm text-gray-500">{templates.length} templates available</span>
            </div>
            <p className="text-gray-600 mb-6">Start quickly with pre-built flow templates</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer ${template.color}`}
                  onClick={() => handleCreateFromTemplate(template.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <span>Use this template</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Flows Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">My Flows</h2>
          </div>
          
          {flows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No flows yet</p>
              <button
                onClick={handleCreateFlow}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first flow
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nodes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{flow.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          flow.active
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {flow.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900">{flow.nodes.length}</span>
                        <span className="text-sm text-gray-500">nodes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(flow.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/builder/${flow.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(flow.id)}
                        className="text-red-600 hover:text-red-900 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
