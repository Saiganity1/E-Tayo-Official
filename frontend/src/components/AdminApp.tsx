"use client";

import React from "react";
import { Admin, Resource, List, Datagrid, TextField, EmailField, EditButton, Edit, SimpleForm, TextInput, SelectInput, fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const httpClient = (url: string, options: any = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: "application/json" });
    }
    const token = localStorage.getItem("token");
    if (token) {
        options.headers.set("Authorization", `Bearer ${token}`);
    }
    return fetchUtils.fetchJson(url, options);
};

const dataProvider = simpleRestProvider(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api", httpClient);

export const UserList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <EmailField source="email" />
            <TextField source="role" />
            <EditButton />
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
            ]} />
        </SimpleForm>
    </Edit>
);

const authProvider = {
    login: async ({ username, password }: any) => {
        const request = new Request(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        const response = await fetch(request);
        if (response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText);
        }
        const auth = await response.json();
        
        // Only allow admins
        if (auth.role !== 'ROLE_ADMIN' && auth.role !== 'ROLE_SUPERADMIN') {
            throw new Error('Access denied: You are not an Admin');
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
            fullName: name || 'Admin',
        });
    },
    getPermissions: () => {
        const role = localStorage.getItem('userRole');
        return Promise.resolve(role);
    },
};

const AdminApp = () => {
    return (
        <Admin dataProvider={dataProvider} authProvider={authProvider} requireAuth>
            <Resource name="users" list={UserList} edit={UserEdit} />
        </Admin>
    );
};

export default AdminApp;
