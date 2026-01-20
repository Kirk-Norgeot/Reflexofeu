import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService, sitesService } from '@/services/clients.service';
import type { Client, Site } from '@/types/database.types';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getAll(),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ client, userId }: { client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'created_by'>, userId: string }) =>
      clientsService.create(client, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) =>
      clientsService.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesService.getAll(),
  });
}

export function useSite(id: string | undefined) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => sitesService.getById(id!),
    enabled: !!id,
  });
}

export function useSitesByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['sites', 'client', clientId],
    queryFn: () => sitesService.getByClientId(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (site: Omit<Site, 'id' | 'created_at' | 'updated_at'>) =>
      sitesService.create(site),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', 'client', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.client_id] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Site> }) =>
      sitesService.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['sites', 'client', data.client_id] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sitesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}
