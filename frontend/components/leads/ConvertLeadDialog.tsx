'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import type { Lead } from '@/lib/types';

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managers: Array<{ id: string; name: string; email: string }>;
}

export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
  managers,
}: ConvertLeadDialogProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [accountManagerId, setAccountManagerId] = useState<string>('');
  const [projectManagerId, setProjectManagerId] = useState<string>('');

  const handleConvert = async () => {
    if (!lead) return;

    setIsConverting(true);
    try {
      const result = await api.clients.convertLead(
        lead.id,
        accountManagerId || undefined,
        projectManagerId || undefined
      );

      toast.success('Lead converted successfully!', {
        description: result.message,
      });

      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error('Failed to convert lead', {
        description: error.message,
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Convert Lead to Client
          </DialogTitle>
          <DialogDescription>
            This will create a new client for {lead.company} and generate the first project from this lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Lead</p>
              <p className="font-semibold">{lead.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-semibold">{lead.company}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Value</p>
              <p className="font-semibold">${lead.value.toLocaleString()}</p>
            </div>
          </div>

          {/* Account Manager Selection */}
          <div className="space-y-2">
            <Label>Account Manager (Optional)</Label>
            <Select value={accountManagerId} onValueChange={setAccountManagerId}>
              <SelectTrigger>
                <SelectValue placeholder={lead.assignedTo?.name || 'Use lead owner'} />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Defaults to lead owner: {lead.assignedTo?.name || 'Unassigned'}
            </p>
          </div>

          {/* Project Manager Selection */}
          <div className="space-y-2">
            <Label>Project Manager (Optional)</Label>
            <Select value={projectManagerId} onValueChange={setProjectManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="Use account manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Defaults to account manager if not specified
            </p>
          </div>

          {/* What Will Happen */}
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg space-y-2">
            <p className="font-semibold text-sm text-green-900">What will happen:</p>
            <ul className="space-y-1 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>New client "{lead.company}" will be created</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>First project worth ${lead.value.toLocaleString()} will be created</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Lead will be marked as converted</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isConverting}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={isConverting}>
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to Client'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
