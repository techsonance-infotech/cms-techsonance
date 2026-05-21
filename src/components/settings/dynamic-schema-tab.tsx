'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Database, Sparkles, Loader2 } from 'lucide-react';
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

  // New Entity Form State
  const [entityName, setEntityName] = useState('');
  const [entitySlug, setEntitySlug] = useState('');
  const [entityDesc, setEntityDesc] = useState('');
  const [creatingEntity, setCreatingEntity] = useState(false);

  // New Field Form State
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldDefault, setFieldDefault] = useState('');
  const [creatingField, setCreatingField] = useState(false);

  useEffect(() => {
    fetchEntities();
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      fetchFields(selectedEntity);
    } else {
      setFields([]);
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

  const fetchFields = async (slug: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/dynamic/schema?entitySlug=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields || []);
      }
    } catch {
      toast.error('Failed to load fields for this entity');
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
        await fetchFields(selectedEntity);
      } else {
        toast.error('Failed to register schema field');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setCreatingField(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Column 1 & 2: Entity & Field Detail Management */}
      <div className="space-y-6 md:col-span-2">
        <Card className="shadow-md bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-muted/30 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Dynamic Schema Configuration
                </CardTitle>
                <CardDescription>Design dynamic data forms and dynamic entities</CardDescription>
              </div>
              <div className="w-full md:w-56">
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="h-9">
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
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : selectedEntity ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Active Fields Schema Configuration
                  </h4>
                  <div className="grid gap-3">
                    {fields.length === 0 ? (
                      <div className="text-center py-12 bg-muted/20 border border-dashed rounded-lg text-sm text-muted-foreground/60 italic">
                        No fields have been defined for this entity yet. Add one below!
                      </div>
                    ) : (
                      fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-4 bg-card border border-muted/50 rounded-xl hover:shadow-sm transition-all duration-150"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{field.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] capitalize bg-indigo-50 text-indigo-600 font-bold border-none">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge className="text-[10px] bg-rose-50 text-rose-600 font-bold border-none">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                          {field.default_value && (
                            <p className="text-xs text-muted-foreground font-medium">
                              Default: <span className="font-mono">{field.default_value}</span>
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Field Section */}
                <div className="border-t border-muted/40 pt-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Register New Field Column
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fieldName">Field Variable Name *</Label>
                      <Input
                        id="fieldName"
                        placeholder="e.g. engine_number, fuel_capacity"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fieldType">Data Type *</Label>
                      <Select value={fieldType} onValueChange={setFieldType}>
                        <SelectTrigger id="fieldType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text (String)</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean (True/False)</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fieldDefault">Default Value (Optional)</Label>
                      <Input
                        id="fieldDefault"
                        placeholder="e.g. 0, Pending"
                        value={fieldDefault}
                        onChange={(e) => setFieldDefault(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-muted/50 rounded-xl bg-muted/10 h-10 mt-8">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">Strictly Required</Label>
                        <p className="text-[10px] text-muted-foreground">Block submission if field is empty</p>
                      </div>
                      <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
                    </div>
                  </div>
                  <Button onClick={handleCreateField} disabled={creatingField} className="mt-6 bg-indigo-600 hover:bg-indigo-700">
                    {creatingField ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Append Field Column
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground/60 italic">
                Please register a custom entity in the sidebar to define schema fields.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Custom Entity Creator */}
      <div className="space-y-6">
        <Card className="shadow-md bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent border-indigo-500/10 h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Register Custom Entity
            </CardTitle>
            <CardDescription>Define a low-code database table (e.g. Machinery, Raw Materials)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entityName">Display Name *</Label>
              <Input
                id="entityName"
                placeholder="e.g. Machinery Inventory"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entitySlug">Lookup Slug *</Label>
              <Input
                id="entitySlug"
                placeholder="e.g. machinery"
                value={entitySlug}
                onChange={(e) => setEntitySlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityDesc">Description</Label>
              <Input
                id="entityDesc"
                placeholder="Brief summary of records purpose"
                value={entityDesc}
                onChange={(e) => setEntityDesc(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateEntity}
              disabled={creatingEntity}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
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
      </div>
    </div>
  );
}
