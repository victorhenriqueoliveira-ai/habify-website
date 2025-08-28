import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Download, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
} from 'lucide-react';

type LogLevel = 'info' | 'warning' | 'error' | 'success';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  user?: string;
  ip?: string;
  details?: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-08-28T14:30:15Z',
    level: 'info',
    category: 'Authentication',
    message: 'Usuário logado com sucesso',
    user: 'marina@habify.com',
    ip: '192.168.1.100',
    details: 'Login realizado via dashboard admin'
  },
  {
    id: '2',
    timestamp: '2024-08-28T14:25:42Z',
    level: 'warning',
    category: 'Database',
    message: 'Conexão com banco lenta',
    ip: '10.0.0.5',
    details: 'Query demorou 5.2s para executar - SELECT * FROM projects'
  },
  {
    id: '3',
    timestamp: '2024-08-28T14:20:33Z',
    level: 'error',
    category: 'API',
    message: 'Falha ao enviar email de notificação',
    user: 'carlos@email.com',
    ip: '192.168.1.105',
    details: 'SMTP timeout - Unable to connect to smtp.gmail.com:587'
  },
  {
    id: '4',
    timestamp: '2024-08-28T14:15:18Z',
    level: 'success',
    category: 'Project',
    message: 'Projeto concluído com sucesso',
    user: 'roberto@email.com',
    ip: '192.168.1.102',
    details: 'Projeto "Casa Moderna no Brooklin" finalizado e publicado'
  },
  {
    id: '5',
    timestamp: '2024-08-28T14:10:55Z',
    level: 'info',
    category: 'System',
    message: 'Backup automático executado',
    details: 'Backup completo do banco de dados realizado - 2.3GB'
  },
  {
    id: '6',
    timestamp: '2024-08-28T14:05:21Z',
    level: 'warning',
    category: 'Security',
    message: 'Tentativa de login falhada',
    user: 'unknown@test.com',
    ip: '45.123.45.67',
    details: 'Múltiplas tentativas de login com credenciais inválidas'
  },
  {
    id: '7',
    timestamp: '2024-08-28T14:00:12Z',
    level: 'error',
    category: 'File Upload',
    message: 'Erro no upload de arquivo',
    user: 'ana@email.com',
    ip: '192.168.1.108',
    details: 'Arquivo muito grande: 15MB - Limite: 10MB'
  },
  {
    id: '8',
    timestamp: '2024-08-28T13:55:33Z',
    level: 'info',
    category: 'User',
    message: 'Novo usuário cadastrado',
    user: 'admin@habify.com',
    ip: '192.168.1.100',
    details: 'Usuário "João Silva" criado com perfil "user"'
  },
];

const logLevelConfig = {
  info: {
    color: 'default',
    icon: Info,
    label: 'Info'
  },
  warning: {
    color: 'secondary',
    icon: AlertTriangle,
    label: 'Warning'
  },
  error: {
    color: 'destructive',
    icon: AlertCircle,
    label: 'Error'
  },
  success: {
    color: 'default',
    icon: CheckCircle,
    label: 'Success'
  }
} as const;

export const LogsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(mockLogs.map(log => log.category)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const logStats = {
    total: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
    success: logs.filter(l => l.level === 'success').length,
  };

  const handleExportLogs = () => {
    const csvContent = logs.map(log => 
      `${log.timestamp},${log.level},${log.category},"${log.message}",${log.user || ''},${log.ip || ''}`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habify-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Monitore atividades e eventos do sistema em tempo real
          </p>
        </div>
        <Button onClick={handleExportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Info className="mr-1 h-4 w-4 text-blue-500" />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{logStats.info}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{logStats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="mr-1 h-4 w-4 text-yellow-500" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logStats.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logStats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedLevel} onValueChange={(value: LogLevel | 'all') => setSelectedLevel(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Logs ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Registros de atividade do sistema em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const config = logLevelConfig[log.level];
                const Icon = config.icon;
                
                return (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.color as any} className="flex items-center w-fit">
                        <Icon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.message}</p>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {log.user || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {log.ip || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum log encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há logs que correspondam aos filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};