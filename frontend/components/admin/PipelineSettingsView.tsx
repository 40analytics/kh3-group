'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Loader2,
  Lock,
  Save,
  GripVertical,
} from 'lucide-react';
import {
  pipelineApi,
  type PipelineStage,
  type CreateStageDto,
} from '@/lib/api/pipeline-client';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { color: 'bg-gray-500', lightColor: 'bg-gray-50', border: 'border-gray-200', label: 'Gray' },
  { color: 'bg-blue-500', lightColor: 'bg-blue-50', border: 'border-blue-200', label: 'Blue' },
  { color: 'bg-purple-500', lightColor: 'bg-purple-50', border: 'border-purple-200', label: 'Purple' },
  { color: 'bg-orange-500', lightColor: 'bg-orange-50', border: 'border-orange-200', label: 'Orange' },
  { color: 'bg-green-500', lightColor: 'bg-green-50', border: 'border-green-200', label: 'Green' },
  { color: 'bg-red-500', lightColor: 'bg-red-50', border: 'border-red-200', label: 'Red' },
  { color: 'bg-yellow-500', lightColor: 'bg-yellow-50', border: 'border-yellow-200', label: 'Yellow' },
  { color: 'bg-teal-500', lightColor: 'bg-teal-50', border: 'border-teal-200', label: 'Teal' },
  { color: 'bg-pink-500', lightColor: 'bg-pink-50', border: 'border-pink-200', label: 'Pink' },
  { color: 'bg-indigo-500', lightColor: 'bg-indigo-50', border: 'border-indigo-200', label: 'Indigo' },
];

export function PipelineSettingsView() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PipelineStage | null>(null);

  // New stage form
  const [newStageName, setNewStageName] = useState('');
  const [newStageProbability, setNewStageProbability] = useState(50);
  const [newStageColorIdx, setNewStageColorIdx] = useState(0);
  const [adding, setAdding] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editProbability, setEditProbability] = useState(0);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const data = await pipelineApi.getStages();
      setStages(data);
    } catch (error) {
      toast.error('Failed to load pipeline stages');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      toast.error('Stage name is required');
      return;
    }
    setAdding(true);
    try {
      const preset = COLOR_PRESETS[newStageColorIdx];
      await pipelineApi.createStage({
        name: newStageName.trim(),
        probability: newStageProbability,
        color: preset.color,
        lightColor: preset.lightColor,
        border: preset.border,
      });
      setNewStageName('');
      setNewStageProbability(50);
      toast.success('Stage created');
      await loadStages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create stage');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!deleteTarget) return;
    try {
      await pipelineApi.deleteStage(deleteTarget.id);
      toast.success(`Stage "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await loadStages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete stage');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    [newStages[index], newStages[targetIndex]] = [
      newStages[targetIndex],
      newStages[index],
    ];

    // Update sortOrder
    const reordered = newStages.map((s, i) => ({ ...s, sortOrder: i }));
    setStages(reordered);

    try {
      await pipelineApi.reorderStages({
        stages: reordered.map((s) => ({ id: s.id, sortOrder: s.sortOrder })),
      });
    } catch (error) {
      toast.error('Failed to reorder stages');
      await loadStages();
    }
  };

  const startEdit = (stage: PipelineStage) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditProbability(stage.probability);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await pipelineApi.updateStage(editingId, {
        name: editName,
        probability: editProbability,
      });
      setEditingId(null);
      toast.success('Stage updated');
      await loadStages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display tracking-tight">
          Pipeline Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure pipeline stages, probabilities, and ordering.
        </p>
      </div>

      {/* Stages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead className="w-10">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Probability %</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage, index) => (
                <TableRow key={stage.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === stages.length - 1}
                          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`w-5 h-5 rounded-full ${stage.color}`}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === stage.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-40"
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => startEdit(stage)}
                      >
                        {stage.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === stage.id ? (
                      <Input
                        type="number"
                        value={editProbability}
                        onChange={(e) =>
                          setEditProbability(parseInt(e.target.value) || 0)
                        }
                        className="h-8 w-20"
                        min={0}
                        max={100}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => startEdit(stage)}
                      >
                        {stage.probability}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {stage.isSystem ? (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" /> System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === stage.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={stage.isSystem}
                          onClick={() => setDeleteTarget(stage)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add New Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g., Qualified"
              />
            </div>
            <div className="space-y-1.5 w-32">
              <label className="text-sm font-medium">Probability %</label>
              <Input
                type="number"
                value={newStageProbability}
                onChange={(e) =>
                  setNewStageProbability(parseInt(e.target.value) || 0)
                }
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-1">
                {COLOR_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    onClick={() => setNewStageColorIdx(i)}
                    className={`w-6 h-6 rounded-full ${preset.color} ${
                      newStageColorIdx === i
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : ''
                    }`}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAddStage} disabled={adding} className="gap-2">
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the &quot;{deleteTarget?.name}&quot;
              stage? This cannot be undone. Stages with leads assigned cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
