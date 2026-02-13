'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Key,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { APIKeyStatus } from '@/lib/types';

export default function AdminAISettingsView() {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKeyStatus, setApiKeyStatus] = useState<APIKeyStatus | null>(null);
  const [savingAiSettings, setSavingAiSettings] = useState(false);

  const loadAISettings = async () => {
    try {
      const settings = await api.admin.getAISettings();
      setSelectedProvider(settings.defaultProvider || 'openai');
      const keyStatus = await api.admin.checkAPIKeys();
      setApiKeyStatus(keyStatus);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  useEffect(() => {
    loadAISettings();
  }, []);

  const handleSaveAISettings = async () => {
    try {
      setSavingAiSettings(true);
      await api.admin.updateAISettings({ defaultProvider: selectedProvider });
      toast.success('AI settings updated', {
        description: `Default provider set to ${selectedProvider}`,
      });
      loadAISettings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save settings';
      toast.error('Failed to update AI settings', { description: message });
    } finally {
      setSavingAiSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display tracking-tight">AI Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure AI providers and manage API keys
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI Provider Configuration
          </CardTitle>
          <CardDescription>
            Configure AI providers and manage API keys for intelligent features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default AI Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span>Anthropic Claude</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-green-600" />
                      <span>OpenAI GPT-4 (Recommended)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-primary" />
                      <span>Google Gemini</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This provider will be used for all AI-powered features
              </p>
              <Button
                onClick={handleSaveAISettings}
                disabled={savingAiSettings}
                className="w-full mt-2"
              >
                {savingAiSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key Status
              </h4>
              <div className="space-y-2">
                {apiKeyStatus ? (
                  Object.entries(apiKeyStatus).map(([provider, isValid]) => (
                    <Card
                      key={provider}
                      className={
                        isValid
                          ? 'border-green-200 bg-green-50'
                          : 'border-border bg-muted'
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isValid ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {provider.charAt(0).toUpperCase() + provider.slice(1)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isValid ? 'API key configured' : 'No API key configured'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={isValid ? 'default' : 'secondary'}>
                            {isValid ? 'Active' : 'Not Set'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="p-4 bg-muted rounded-lg border border-border">
              <div className="flex gap-3">
                <BrainCircuit className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">AI Features Available</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Lead risk analysis and scoring</li>
                    <li>• Client health monitoring</li>
                    <li>• Upsell opportunity detection</li>
                    <li>• Executive summary generation</li>
                    <li>• AI-powered chat assistant</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
