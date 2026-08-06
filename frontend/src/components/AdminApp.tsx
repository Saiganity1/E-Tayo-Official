"use client";

import React from "react";
import { Admin, Resource, List, Datagrid, TextField, EmailField, EditButton, DeleteButton, Edit, Create, SimpleForm, TextInput, SelectInput, fetchUtils, defaultTheme } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:8080/api";

const httpClient = (url: string, options: any = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    
    const token = localStorage.getItem("token");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    
    options.headers = headers;
    return fetchUtils.fetchJson(url, options);
};

const dataProvider = simpleRestProvider(API_URL, httpClient);

export const UserList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <EmailField source="email" />
            <TextField source="role" />
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);

export const UserEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="id" disabled />
            <TextInput source="name" />
            <TextInput source="email" />
            <SelectInput source="role" choices={[
                { id: 'ROLE_APPLICANT', name: 'Applicant' },
                { id: 'ROLE_STAFF', name: 'Staff' },
                { id: 'ROLE_ADMIN', name: 'Admin' },
                { id: 'ROLE_SUPERADMIN', name: 'SuperAdmin' },
            ]} />
        </SimpleForm>
    </Edit>
);

export const UserCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" required />
            <TextInput source="email" required />
            <SelectInput source="role" choices={[
                { id: 'ROLE_APPLICANT', name: 'Applicant' },
                { id: 'ROLE_STAFF', name: 'Staff' },
                { id: 'ROLE_ADMIN', name: 'Admin' },
                { id: 'ROLE_SUPERADMIN', name: 'SuperAdmin' },
            ]} required defaultValue="ROLE_APPLICANT" />
        </SimpleForm>
    </Create>
);

const authProvider = {
    login: async ({ username, password }: any) => {
        const request = new Request(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        const response = await fetch(request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText);
        }
        const auth = await response.json();
        
        // Strict Developer Access Only
        if (auth.role !== 'ROLE_SUPERADMIN') {
            throw new Error('Access denied: Only Developers (SuperAdmins) can access this system.');
        }

        localStorage.setItem('token', auth.accessToken);
        localStorage.setItem('userRole', auth.role);
        localStorage.setItem('userName', auth.name);
        return Promise.resolve();
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        return Promise.resolve();
    },
    checkAuth: () => {
        return localStorage.getItem('token') ? Promise.resolve() : Promise.reject();
    },
    checkError: (error: any) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    getIdentity: () => {
        const name = localStorage.getItem('userName');
        return Promise.resolve({
            id: 'user',
            fullName: name || 'Super Admin',
        });
    },
    getPermissions: () => {
        const role = localStorage.getItem('userRole');
        return Promise.resolve(role);
    },
};

const eTayoTheme = {
    ...defaultTheme,
    palette: {
        mode: 'light' as const,
        primary: {
            main: '#1d4ed8', // e-Tayo Blue
        },
        secondary: {
            main: '#f59e0b', // e-Tayo Yellow/Orange accent
        },
        background: {
            default: '#f8fafc', // Clean slate background
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
        button: {
            textTransform: 'none' as const,
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e3a8a', // Darker blue for app bar
                    boxShadow: 'none',
                },
            },
        },
    },
};

const AdminApp = () => {
    return (
        <Admin dataProvider={dataProvider} authProvider={authProvider} theme={eTayoTheme} requireAuth>
            <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} />
        </Admin>
    );
};

export default AdminApp;
