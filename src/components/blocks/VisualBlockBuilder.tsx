import { useState, useEffect } from 'react';
import { BlockData, BLOCK_REGISTRY, createBlock, DesignSettings, DEFAULT_DESIGN_SETTINGS } from '@/types/blocks';
import { BlockEditor } from './BlockEditors';
import { renderBlock } from './BlockRenderers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Copy, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown,
  Zap, Grid, MessageSquare, Package, HelpCircle, Mail, Type, Image as ImageIcon, Video as VideoIcon,
  Monitor, Tablet, Smartphone, Undo2, Redo2, Layout, Save, Settings2, MoreVertical, Search
} from 'lucide-react';
import { SEOHelper } from './SEOHelper';
import { toast } from 'sonner';
import { DynamicPackages } from './DynamicPackages';

// dnd-kit imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Context Menu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VisualBlockBuilderProps {
  blocks: BlockData[];
  onBlocksChange: (blocks: BlockData[]) => void;
  designSettings?: DesignSettings;
  onDesignSettingsChange?: (settings: DesignSettings) => void;
  pageTitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  onMetaTitleChange?: (v: string) => void;
  onMetaDescriptionChange?: (v: string) => void;
  onKeywordsChange?: (v: string) => void;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  hero: <Zap className="h-4 w-4" />,
  features: <Grid className="h-4 w-4" />,
  testimonials: <MessageSquare className="h-4 w-4" />,
  packages: <Package className="h-4 w-4" />,
  faq: <HelpCircle className="h-4 w-4" />,
  contact: <Mail className="h-4 w-4" />,
  richtext: <Type className="h-4 w-4" />,
  gallery: <ImageIcon className="h-4 w-4" />,
  video: <VideoIcon className="h-4 w-4" />,
};

// Sortable Item Component
interface SortableBlockItemProps {
  block: BlockData;
  idx: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string, e: React.MouseEvent) => void;
  onMove: (id: string, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onMoveToTop: (id: string) => void;
  onMoveToBottom: (id: string) => void;
}

function SortableBlockItem({ 
  block, idx, isSelected, onSelect, onToggleVisibility, 
  onMove, onDuplicate, onDelete, onMoveToTop, onMoveToBottom 
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const definition = BLOCK_REGISTRY[block.type];
  const isVisible = block.settings?.isVisible !== false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(block.id)}
      className={`group flex items-center gap-2 p-2 border rounded-lg cursor-default transition-all ${
        isSelected
          ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
          : 'bg-card hover:bg-muted/50 border-border'
      } ${!isVisible ? 'opacity-60 grayscale' : ''} ${isDragging ? 'shadow-lg ring-2 ring-primary/50 opacity-50' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100" />
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground w-4">
            {idx + 1}
          </span>
          {BLOCK_ICONS[block.type]}
          <span className="font-medium text-xs truncate">{definition.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => onToggleVisibility(block.id, e)}
          title={isVisible ? "Sembunyikan" : "Tampilkan"}
        >
          {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-destructive" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => onDuplicate(block.id, e as any)}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Duplikasi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveToTop(block.id)}>
              <ChevronUp className="h-3.5 w-3.5 mr-2" />
              Ke Atas Sendiri
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveToBottom(block.id)}>
              <ChevronDown className="h-3.5 w-3.5 mr-2" />
              Ke Bawah Sendiri
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => onDelete(block.id, e as any)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function VisualBlockBuilder({ 
  blocks, 
  onBlocksChange, 
  designSettings = DEFAULT_DESIGN_SETTINGS,
  onDesignSettingsChange,
  pageTitle = '',
  metaTitle = '',
  metaDescription = '',
  keywords = '',
  onMetaTitleChange = () => {},
  onMetaDescriptionChange = () => {},
  onKeywordsChange = () => {},
}: VisualBlockBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<BlockData[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const globalDesign = designSettings;
  const setGlobalDesign = (newDesign: DesignSettings) => {
    if (onDesignSettingsChange) {
      onDesignSettingsChange(newDesign);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Undo/Redo Implementation
  const addToHistory = (newBlocks: BlockData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevBlocks = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onBlocksChange(prevBlocks);
      toast.info('Undo berhasil');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextBlocks = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onBlocksChange(nextBlocks);
      toast.info('Redo berhasil');
    }
  };

  const handleBlocksChange = (newBlocks: BlockData[]) => {
    onBlocksChange(newBlocks);
    addToHistory(newBlocks);
  };

  const addBlock = (blockType: keyof typeof BLOCK_REGISTRY) => {
    const newBlock = createBlock(blockType);
    newBlock.order = blocks.length;
    // Default visibility
    newBlock.settings = { ...newBlock.settings, isVisible: true };
    const updatedBlocks = [...blocks, newBlock];
    handleBlocksChange(updatedBlocks);
    setSelectedBlockId(newBlock.id);
    toast.success(`Blok ${BLOCK_REGISTRY[blockType].label} ditambahkan`);
  };

  const updateBlock = (updatedBlock: BlockData) => {
    const updatedBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    handleBlocksChange(updatedBlocks);
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedBlocks = blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          settings: { ...b.settings, isVisible: b.settings?.isVisible === false }
        };
      }
      return b;
    });
    handleBlocksChange(updatedBlocks);
  };

  const deleteBlock = (id: string, e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus blok ini?')) {
      const updatedBlocks = blocks.filter(b => b.id !== id);
      handleBlocksChange(updatedBlocks);
      if (selectedBlockId === id) {
        setSelectedBlockId(updatedBlocks.length > 0 ? updatedBlocks[0].id : null);
      }
      toast.success('Blok dihapus');
    }
  };

  const duplicateBlock = (id: string, e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (blockToDuplicate) {
      const newBlock: BlockData = {
        ...JSON.parse(JSON.stringify(blockToDuplicate)),
        id: `block-${Date.now()}`,
        order: blocks.length,
      };
      const updatedBlocks = [...blocks, newBlock];
      handleBlocksChange(updatedBlocks);
      setSelectedBlockId(newBlock.id);
      toast.success('Blok diduplikasi');
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const index = blocks.findIndex(b => b.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) {
      return;
    }

    const updatedBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];

    // Update order
    updatedBlocks.forEach((block, idx) => {
      block.order = idx;
    });

    handleBlocksChange(updatedBlocks);
  };

  const moveToTop = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === 0) return;
    
    const updatedBlocks = [...blocks];
    const item = updatedBlocks.splice(index, 1)[0];
    updatedBlocks.unshift(item);
    
    updatedBlocks.forEach((block, idx) => {
      block.order = idx;
    });
    
    handleBlocksChange(updatedBlocks);
    toast.info('Pindah ke atas');
  };

  const moveToBottom = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === blocks.length - 1) return;
    
    const updatedBlocks = [...blocks];
    const item = updatedBlocks.splice(index, 1)[0];
    updatedBlocks.push(item);
    
    updatedBlocks.forEach((block, idx) => {
      block.order = idx;
    });
    
    handleBlocksChange(updatedBlocks);
    toast.info('Pindah ke bawah');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      newBlocks.forEach((block, idx) => {
        block.order = idx;
      });
      handleBlocksChange(newBlocks);
    }
  };

  const getPreviewSize = () => {
    switch (previewDevice) {
      case 'tablet': return 'max-w-[768px]';
      case 'mobile': return 'max-w-[375px]';
      default: return 'max-w-full';
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card p-2 border rounded-lg sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0} title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex === history.length - 1} title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <div className="flex bg-muted p-1 rounded-md">
            <Button 
              variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 px-2" 
              onClick={() => setPreviewDevice('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button 
              variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 px-2" 
              onClick={() => setPreviewDevice('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button 
              variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 px-2" 
              onClick={() => setPreviewDevice('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {blocks.length} Blok
          </Badge>
        </div>
      </div>

      {/* Split Screen Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Left Column: Editor Controls */}
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
          <Tabs defaultValue="structure" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="structure" className="flex items-center gap-1 text-xs">
                <Layout className="h-3.5 w-3.5" /> Struktur
              </TabsTrigger>
              <TabsTrigger value="design" className="flex items-center gap-1 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Desain
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-1 text-xs">
                <Search className="h-3.5 w-3.5" /> SEO
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="structure" className="space-y-6 mt-4">
              {/* Add Blocks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Blok
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(BLOCK_REGISTRY).map(([key, definition]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => addBlock(key as any)}
                        className="flex flex-col items-center gap-1 h-auto py-3 px-1"
                      >
                        {BLOCK_ICONS[key]}
                        <span className="text-[10px] text-center leading-tight">{definition.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blocks List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Struktur Halaman
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3">
                  {blocks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">Belum ada blok.</p>
                    </div>
                  ) : (
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {blocks.map((block, idx) => (
                            <SortableBlockItem
                              key={block.id}
                              block={block}
                              idx={idx}
                              isSelected={selectedBlockId === block.id}
                              onSelect={setSelectedBlockId}
                              onToggleVisibility={toggleVisibility}
                              onMove={moveBlock}
                              onDuplicate={duplicateBlock}
                              onDelete={deleteBlock}
                              onMoveToTop={moveToTop}
                              onMoveToBottom={moveToBottom}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pengaturan Gaya Global</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Warna Utama Brand</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={globalDesign.primaryColor}
                        onChange={(e) => setGlobalDesign({...globalDesign, primaryColor: e.target.value})}
                        className="h-10 w-10 rounded border p-1"
                      />
                      <input 
                        type="text" 
                        value={globalDesign.primaryColor}
                        onChange={(e) => setGlobalDesign({...globalDesign, primaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jenis Font</label>
                    <select 
                      value={globalDesign.fontFamily}
                      onChange={(e) => setGlobalDesign({...globalDesign, fontFamily: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="sans-serif">Sans Serif (Default)</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                      <option value="'Inter', sans-serif">Inter</option>
                      <option value="'Poppins', sans-serif">Poppins</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Radius Sudut (Border Radius)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="24" 
                        value={parseInt(globalDesign.borderRadius)}
                        onChange={(e) => setGlobalDesign({...globalDesign, borderRadius: `${e.target.value}px`})}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-12 text-right">{globalDesign.borderRadius}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t flex items-center justify-between">
                    <label className="text-sm font-medium">Aktifkan Animasi Scroll (AOS)</label>
                    <input 
                      type="checkbox"
                      checked={globalDesign.enableAOS !== false}
                      onChange={(e) => setGlobalDesign({...globalDesign, enableAOS: e.target.checked})}
                      className="h-4 w-4"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[10px] text-muted-foreground italic">
                      * Pengaturan ini akan diterapkan secara otomatis ke seluruh blok yang mendukung gaya global.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SEO & Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <SEOHelper 
                    pageTitle={pageTitle}
                    metaTitle={metaTitle}
                    metaDescription={metaDescription}
                    keywords={keywords}
                    onMetaTitleChange={onMetaTitleChange}
                    onMetaDescriptionChange={onMetaDescriptionChange}
                    onKeywordsChange={onKeywordsChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Selected Block Editor */}
          {selectedBlock ? (
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {BLOCK_ICONS[selectedBlock.type]}
                    <span>Edit: {BLOCK_REGISTRY[selectedBlock.type].label}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBlockId(null)}>
                    Tutup
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <BlockEditor block={selectedBlock} onChange={updateBlock} />
              </CardContent>
            </Card>
          ) : activeTab === 'content' && (
            <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground text-sm">
              Pilih blok untuk mulai mengedit
            </div>
          )}
        </div>

        {/* Right Column: Live Preview */}
        <div className="bg-muted/30 rounded-xl border p-4 flex flex-col h-full max-h-[calc(100vh-250px)]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </h4>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              {previewDevice} view
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-white rounded-lg shadow-inner border relative">
            <div 
              className={`mx-auto transition-all duration-300 ${getPreviewSize()} bg-white min-h-full`}
              style={{ 
                fontFamily: globalDesign.fontFamily,
                '--primary': globalDesign.primaryColor,
                '--radius': globalDesign.borderRadius,
              } as React.CSSProperties}
            >
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                  <Layout className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Pratinjau akan muncul di sini</p>
                </div>
              ) : (
                <div className="w-full">
                  {blocks.map((block) => {
                    const isSelected = selectedBlockId === block.id;
                    const isVisible = block.settings?.isVisible !== false;
                    
                    if (!isVisible) return null;

                    return (
                      <div
                        key={block.id}
                        className="relative group/preview"
                      >
                        <div className={`relative ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}>
                          {block.type === 'packages' ? (
                            <div className={`${block.settings?.paddingTop || 'py-16'} ${block.settings?.paddingBottom || 'py-16'} ${block.settings?.customClass || ''}`} style={{ backgroundColor: block.settings?.backgroundColor }}>
                              <div className="max-w-6xl mx-auto px-4">
                                <div className="text-center mb-12">
                                  <h2 className="text-3xl font-bold mb-2">{block.content.title}</h2>
                                  {block.content.subtitle && <p className="text-muted-foreground">{block.content.subtitle}</p>}
                                </div>
                                <DynamicPackages content={block.content as any} />
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="pointer-events-none"
                              dangerouslySetInnerHTML={{
                                __html: renderBlock(block),
                              }}
                            />
                          )}
                        </div>
                        {/* Selection Overlay */}
                        <div 
                          className={`absolute inset-0 cursor-pointer z-10 hover:bg-primary/5 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                          onClick={() => setSelectedBlockId(block.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
