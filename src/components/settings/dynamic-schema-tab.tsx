'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Database, Sparkles, Loader2, FileCode, CheckCircle, 
  RefreshCw, Layers, Sliders, Play, Trash, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Entity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Field {
  id: string;
  entity_slug: string;
  name: string;
  type: string;
  required: boolean;
  default_value: string | null;
}

export function DynamicSchemaTab() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);

  // Schema Layout Details
  const [sections, setSections] = useState<string[]>(['General Information', 'Additional Metadata']);
  const [newSection, setNewSection] = useState('');
  const [tabs, setTabs] = useState<string[]>(['Primary Tab', 'Advanced Detail']);
  const [newTabName, setNewTabName] = useState('');

  // Active form layouts publishing & rollback details
  const [activeSchema, setActiveSchema] = useState<any>(null);
  const [schemaHistory, setSchemaHistory] = useState<any[]>([]);
  const [publishing, setPublishing] = useState(false);

  // New Entity Form State
  const [entityName, setEntityName] = useState('');
  const [entitySlug, setEntitySlug] = useState('');
  const [entityDesc, setEntityDesc] = useState('');
  const [creatingEntity, setCreatingEntity] = useState(false);

  // New Field Constructor Options
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldDefault, setFieldDefault] = useState('');
  const [fieldSection, setFieldSection] = useState('General Information');
  const [fieldTab, setFieldTab] = useState('Primary Tab');

  // Extended features: Validations
  const [valRegex, setValRegex] = useState('');
  const [valMin, setValMin] = useState('');
  const [valMax, setValMax] = useState('');

  // Extended features: Conditionals
  const [condEnabled, setCondEnabled] = useState(false);
  const [condField, setCondField] = useState('');
  const [condValue, setCondValue] = useState('');

  // Extended features: Lookup / Formula
  const [formulaEnabled, setFormulaEnabled] = useState(false);
  const [formulaExpression, setFormulaExpression] = useState('');

  // Extended features: Repeaters
  const [repeaterEnabled, setRepeaterEnabled] = useState(false);
  const [repeaterFieldsJson, setRepeaterFieldsJson] = useState('[]');

  // JSON Preview Modals
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [previewInputData, setPreviewInputData] = useState<any>({});

  const [creatingField, setCreatingField] = useState(false);

  useEffect(() => {
    fetchEntities();
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      fetchFieldsAndActiveSchema(selectedEntity);
      fetchSchemaHistory(selectedEntity);
    } else {
      setFields([]);
      setActiveSchema(null);
      setSchemaHistory([]);
    }
  }, [selectedEntity]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/dynamic/schema', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
        if (data.entities?.length > 0) {
          setSelectedEntity(data.entities[0].slug);
        }
      }
    } catch {
      toast.error('Failed to fetch custom entities');
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldsAndActiveSchema = async (slug: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/dynamic/schema?entitySlug=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields || []);
        setActiveSchema(data.activeSchema || null);
      }
    } catch {
      toast.error('Failed to load fields for this entity');
    }
  };

  const fetchSchemaHistory = async (slug: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/dynamic/schema?history=true&entitySlug=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchemaHistory(data.schemas || []);
      }
    } catch {
      toast.error('Failed to fetch schema versions history');
    }
  };

  const handleCreateEntity = async () => {
    if (!entityName || !entitySlug) {
      toast.error('Name and Slug are required');
      return;
    }
    setCreatingEntity(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/dynamic/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'entity',
          name: entityName,
          slug: entitySlug.toLowerCase().replace(/\s+/g, '-'),
          description: entityDesc,
        }),
      });

      if (res.ok) {
        toast.success('Custom Entity registered successfully!');
        setEntityName('');
        setEntitySlug('');
        setEntityDesc('');
        await fetchEntities();
      } else {
        toast.error('Failed to register entity');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setCreatingEntity(false);
    }
  };

  const handleCreateField = async () => {
    if (!fieldName || !selectedEntity) {
      toast.error('Field Name and Active Entity Slug are required');
      return;
    }
    setCreatingField(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/dynamic/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'field',
          entitySlug: selectedEntity,
          name: fieldName.toLowerCase().replace(/\s+/g, '_'),
          fieldType,
          required: fieldRequired,
          defaultValue: fieldDefault,
        }),
      });

      if (res.ok) {
        toast.success('Field successfully appended to schema!');
        setFieldName('');
        setFieldDefault('');
        setFieldRequired(false);

        // Reset details
        setValRegex('');
        setValMin('');
        setValMax('');
        setCondEnabled(false);
        setCondField('');
        setCondValue('');
        setFormulaEnabled(false);
        setFormulaExpression('');
        setRepeaterEnabled(false);

        await fetchFieldsAndActiveSchema(selectedEntity);
      } else {
        toast.error('Failed to register schema field');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setCreatingField(false);
    }
  };

  const handlePublishSchema = async () => {
    if (!selectedEntity) return;
    setPublishing(true);
    try {
      const token = localStorage.getItem('session_token');
      const completeSchema = {
        tabs,
        sections,
        fields: fields.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          required: f.required,
          default: f.default_value,
          section: fieldSection,
          tab: fieldTab,
          validation: valRegex ? { regex: valRegex, min: valMin, max: valMax } : null,
          conditional: condEnabled ? { showIfField: condField, equals: condValue } : null,
          formula: formulaEnabled ? formulaExpression : null,
          repeater: repeaterEnabled ? JSON.parse(repeaterFieldsJson) : null
        }))
      };

      const res = await fetch('/api/dynamic/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'publish-schema',
          entitySlug: selectedEntity,
          schemaJson: completeSchema
        }),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || 'Form Schema published successfully!');
        fetchFieldsAndActiveSchema(selectedEntity);
        fetchSchemaHistory(selectedEntity);
      } else {
        toast.error('Failed to publish form schema');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while publishing');
    } finally {
      setPublishing(false);
    }
  };

  const handleRollbackSchema = async (version: number) => {
    setPublishing(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/dynamic/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'rollback-schema',
          entitySlug: selectedEntity,
          version
        }),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || 'Schema rollback completed successfully!');
        fetchFieldsAndActiveSchema(selectedEntity);
        fetchSchemaHistory(selectedEntity);
      } else {
        toast.error('Failed to rollback schema');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to rollback schema version');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Column 1 & 2: Entity & Field Detail Management */}
      <div className="space-y-6 md:col-span-2">
        <Card className="shadow-md bg-card border border-border">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 font-bold">
                  <Database className="h-5 w-5 text-primary" />
                  Dynamic Schema Custom Form Builder
                </CardTitle>
                <CardDescription>Create fields, validate inputs, configure conditional rules, and manage layouts.</CardDescription>
              </div>
              <div className="w-full md:w-56">
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue placeholder="Select Custom Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((ent) => (
                      <SelectItem key={ent.id} value={ent.slug}>
                        {ent.name} ({ent.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedEntity ? (
              <div className="space-y-6">
                {/* Active Fields List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Registered Fields Schema
                  </h4>
                  <div className="grid gap-3">
                    {fields.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50/50 dark:bg-zinc-900/10 border border-dashed border-border rounded-2xl text-xs text-muted-foreground/60 italic">
                        No fields have been defined for this entity yet. Create one below!
                      </div>
                    ) : (
                      fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-zinc-900/10 border border-border rounded-2xl hover:shadow-xs transition-all duration-150"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-xs">{field.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[9px] capitalize bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground font-bold border-none rounded-md">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge className="text-[9px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold border-none rounded-md">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                          {field.default_value && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Default: <span className="font-mono">{field.default_value}</span>
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Create Layout Sections & Tabs */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Form Sections & Page Tabs
                  </h4>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Add Section */}
                    <div className="space-y-2 p-4 border border-border rounded-2xl bg-slate-50/20">
                      <Label className="text-xs font-bold">Add Layout Section</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. Identity Proofs"
                          className="text-xs rounded-xl"
                          value={newSection}
                          onChange={e => setNewSection(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          className="text-xs rounded-xl border-primary/20 text-primary hover:bg-primary/5 px-4 h-9"
                          onClick={() => {
                            if (!newSection) return;
                            setSections([...sections, newSection]);
                            setNewSection('');
                            toast.success('Layout section added');
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {sections.map((sec, idx) => (
                          <Badge key={idx} variant="outline" className="border-border rounded-lg text-[9px] py-0.5">{sec}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Add Tab */}
                    <div className="space-y-2 p-4 border border-border rounded-2xl bg-slate-50/20">
                      <Label className="text-xs font-bold">Add Form Tab</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. Attachments Tab"
                          className="text-xs rounded-xl"
                          value={newTabName}
                          onChange={e => setNewTabName(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          className="text-xs rounded-xl border-primary/20 text-primary hover:bg-primary/5 px-4 h-9"
                          onClick={() => {
                            if (!newTabName) return;
                            setTabs([...tabs, newTabName]);
                            setNewTabName('');
                            toast.success('Form layout tab added');
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {tabs.map((tb, idx) => (
                          <Badge key={idx} variant="outline" className="border-border rounded-lg text-[9px] py-0.5">{tb}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Field Section */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Register New Field Column
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fieldName" className="text-xs font-bold">Field Variable Name *</Label>
                      <Input
                        id="fieldName"
                        placeholder="e.g. engine_number, fuel_capacity"
                        className="text-xs rounded-xl"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fieldType" className="text-xs font-bold">Data Type *</Label>
                      <select 
                        id="fieldType"
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={fieldType}
                        onChange={e => setFieldType(e.target.value)}
                      >
                        <option value="text">Text (String)</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean (True/False)</option>
                        <option value="date">Date</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Target Layout Section</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={fieldSection}
                        onChange={e => setFieldSection(e.target.value)}
                      >
                        {sections.map((sec, idx) => (
                          <option key={idx} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Target Page Tab</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={fieldTab}
                        onChange={e => setFieldTab(e.target.value)}
                      >
                        {tabs.map((tb, idx) => (
                          <option key={idx} value={tb}>{tb}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="fieldDefault" className="text-xs font-bold">Default Value (Optional)</Label>
                      <Input
                        id="fieldDefault"
                        placeholder="e.g. 0, Pending"
                        className="text-xs rounded-xl"
                        value={fieldDefault}
                        onChange={(e) => setFieldDefault(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-slate-50/20 h-10 mt-6">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">Strictly Required</Label>
                        <p className="text-[10px] text-muted-foreground">Block submission if empty</p>
                      </div>
                      <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
                    </div>
                  </div>

                  {/* Advanced Field Options (Validations, Conditions, Formulas, Repeaters) */}
                  <div className="p-4 border border-border rounded-2xl space-y-4 bg-slate-50/20 mt-4">
                    <h5 className="font-bold text-xs">Advanced Custom Validations & Formulas</h5>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Validation Regex Pattern</Label>
                        <Input 
                          placeholder="e.g. ^[A-Z]{5}[0-9]{4}[A-Z]$"
                          className="text-xs rounded-xl h-8"
                          value={valRegex}
                          onChange={e => setValRegex(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Minimum Length / Value</Label>
                        <Input 
                          placeholder="e.g. 5"
                          className="text-xs rounded-xl h-8"
                          value={valMin}
                          onChange={e => setValMin(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Maximum Length / Value</Label>
                        <Input 
                          placeholder="e.g. 200"
                          className="text-xs rounded-xl h-8"
                          value={valMax}
                          onChange={e => setValMax(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Conditional Rules Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">Enable Conditional Visibility Rule</Label>
                        <p className="text-[10px] text-muted-foreground">Display field only when criteria is satisfied</p>
                      </div>
                      <Switch checked={condEnabled} onCheckedChange={setCondEnabled} />
                    </div>

                    {condEnabled && (
                      <div className="grid gap-3 md:grid-cols-2 pt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Depends on Field Name</Label>
                          <Input 
                            placeholder="e.g. document_type"
                            className="text-xs rounded-xl h-8"
                            value={condField}
                            onChange={e => setCondField(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">When its value equals</Label>
                          <Input 
                            placeholder="e.g. Passport"
                            className="text-xs rounded-xl h-8"
                            value={condValue}
                            onChange={e => setCondValue(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Formula Field Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">Enable Formula Calculated Field</Label>
                        <p className="text-[10px] text-muted-foreground">Derive calculated values from active variables</p>
                      </div>
                      <Switch checked={formulaEnabled} onCheckedChange={setFormulaEnabled} />
                    </div>

                    {formulaEnabled && (
                      <div className="space-y-1.5 pt-2">
                        <Label className="text-[10px] font-bold">Formula Mathematical Expression</Label>
                        <Input 
                          placeholder="e.g. salary * 0.12 + allowances"
                          className="text-xs rounded-xl h-8"
                          value={formulaExpression}
                          onChange={e => setFormulaExpression(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Repeater Block Field Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">Enable Repeater Block (Subfields Group)</Label>
                        <p className="text-[10px] text-muted-foreground">Allows users to dynamically add multiple sub-rows</p>
                      </div>
                      <Switch checked={repeaterEnabled} onCheckedChange={setRepeaterEnabled} />
                    </div>

                    {repeaterEnabled && (
                      <div className="space-y-1.5 pt-2">
                        <Label className="text-[10px] font-bold">Repeater Fields Config JSON</Label>
                        <textarea 
                          rows={3}
                          placeholder='e.g. [{"name":"item_name", "type":"text"}, {"name":"price", "type":"number"}]'
                          className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-mono"
                          value={repeaterFieldsJson}
                          onChange={e => setRepeaterFieldsJson(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Button onClick={handleCreateField} disabled={creatingField} className="mt-6 bg-primary hover:bg-primary/90 rounded-xl font-bold h-9 text-white">
                    {creatingField ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Append Field Column
                  </Button>
                </div>

                {/* Publish & Previews Container */}
                <div className="flex flex-wrap gap-2 border-t pt-6">
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 text-xs font-bold"
                    disabled={publishing}
                    onClick={handlePublishSchema}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Publish Form Schema
                  </Button>

                  <Button 
                    variant="outline" 
                    className="border-border rounded-xl h-9 text-xs font-bold"
                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                  >
                    <FileCode className="h-4 w-4 mr-1.5" /> JSON Preview
                  </Button>

                  <Button 
                    variant="outline" 
                    className="border-border rounded-xl h-9 text-xs font-bold"
                    onClick={() => {
                      setShowFormPreview(!showFormPreview);
                      setPreviewInputData({});
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1.5" /> Preview Form
                  </Button>
                </div>

                {/* JSON Preview Panel */}
                {showJsonPreview && (
                  <div className="p-4 bg-zinc-950 text-green-400 rounded-2xl font-mono text-[10px] overflow-auto max-h-80 border border-border">
                    <h5 className="text-[9px] text-muted-foreground uppercase font-bold mb-2">Live Schema JSON Schema</h5>
                    <pre>
                      {JSON.stringify({
                        entity: selectedEntity,
                        tabs,
                        sections,
                        fields: fields.map(f => ({
                          name: f.name,
                          type: f.type,
                          required: f.required,
                          default: f.default_value,
                          validation: valRegex ? { regex: valRegex, min: valMin, max: valMax } : null,
                          conditional: condEnabled ? { showIf: condField, equals: condValue } : null,
                          formula: formulaEnabled ? formulaExpression : null
                        }))
                      }, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Live Form Preview Simulator */}
                {showFormPreview && (
                  <div className="p-6 border border-primary/20 bg-primary/5 dark:bg-zinc-900/10 rounded-2xl space-y-4">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sliders className="h-4 w-4" /> Live Simulating Form: {selectedEntity}
                    </h5>
                    
                    <div className="space-y-4 pt-2">
                      {fields.map((field) => {
                        // Conditional check
                        if (condEnabled && condField && condValue) {
                          const triggerVal = previewInputData[condField];
                          if (triggerVal !== condValue) return null;
                        }

                        return (
                          <div key={field.id} className="space-y-1">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex gap-1">
                              <span>{field.name}</span>
                              {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            
                            {field.type === 'boolean' ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  className="w-4 h-4 accent-primary"
                                  checked={!!previewInputData[field.name]}
                                  onChange={e => setPreviewInputData({ ...previewInputData, [field.name]: e.target.checked })}
                                />
                                <span className="text-xs">Yes / No</span>
                              </div>
                            ) : field.type === 'number' ? (
                              <Input 
                                type="number"
                                className="text-xs rounded-xl h-9 bg-background"
                                value={previewInputData[field.name] || ''}
                                onChange={e => setPreviewInputData({ ...previewInputData, [field.name]: Number(e.target.value) })}
                              />
                            ) : field.type === 'date' ? (
                              <Input 
                                type="date"
                                className="text-xs rounded-xl h-9 bg-background"
                                value={previewInputData[field.name] || ''}
                                onChange={e => setPreviewInputData({ ...previewInputData, [field.name]: e.target.value })}
                              />
                            ) : (
                              <Input 
                                className="text-xs rounded-xl h-9 bg-background"
                                value={previewInputData[field.name] || ''}
                                onChange={e => setPreviewInputData({ ...previewInputData, [field.name]: e.target.value })}
                              />
                            )}
                          </div>
                        );
                      })}

                      <Button 
                        size="sm" 
                        className="bg-primary text-white rounded-lg"
                        onClick={() => {
                          toast.success('Simulation payload submitted: check console!');
                          console.log('Form submission simulation:', previewInputData);
                        }}
                      >
                        Submit Test data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground/60 italic">
                Please register a custom entity in the sidebar to define schema fields.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Custom Entity & Rollback History */}
      <div className="space-y-6">
        {/* Entity Creator */}
        <Card className="shadow-md bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10 border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              Register Custom Entity
            </CardTitle>
            <CardDescription>Define a low-code database table (e.g. Machinery, Vehicles)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entityName" className="text-xs font-bold">Display Name *</Label>
              <Input
                id="entityName"
                placeholder="e.g. Machinery Inventory"
                className="text-xs rounded-xl"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entitySlug" className="text-xs font-bold">Lookup Slug *</Label>
              <Input
                id="entitySlug"
                placeholder="e.g. machinery"
                className="text-xs rounded-xl"
                value={entitySlug}
                onChange={(e) => setEntitySlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityDesc" className="text-xs font-bold">Description</Label>
              <Input
                id="entityDesc"
                placeholder="Brief summary of records purpose"
                className="text-xs rounded-xl"
                value={entityDesc}
                onChange={(e) => setEntityDesc(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateEntity}
              disabled={creatingEntity}
              className="w-full bg-primary hover:bg-primary/90 rounded-xl h-9 text-white font-bold"
            >
              {creatingEntity ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Register Entity
            </Button>
          </CardContent>
        </Card>

        {/* Versions rollbacks */}
        {selectedEntity && (
          <Card className="shadow-md border border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <RefreshCw className="h-4 w-4 text-primary animate-spin-slow" />
                Published Versions Log
              </CardTitle>
              <CardDescription>Rollback layout styles to past published active schema states.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              {schemaHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  No active versions published.
                </div>
              ) : (
                schemaHistory.map((sch) => (
                  <div key={sch.id} className="flex justify-between items-center p-3 border border-border rounded-xl bg-slate-50 dark:bg-zinc-900/10">
                    <div>
                      <h5 className="font-bold text-xs flex items-center gap-1.5">
                        <span>Version {sch.version}</span>
                        {sch.active && <Badge className="bg-primary text-white border-none text-[8px] font-bold py-0.5 rounded-md">Active</Badge>}
                      </h5>
                      <p className="text-[8px] text-muted-foreground">{new Date(sch.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    {!sch.active && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-[10px] rounded-lg h-7 font-bold border-primary/20 text-primary hover:bg-primary/5 dark:hover:bg-primary/20"
                        onClick={() => handleRollbackSchema(sch.version)}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
