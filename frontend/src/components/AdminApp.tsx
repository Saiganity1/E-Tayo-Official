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

const AdminApp = () => {
    return (
        <Admin dataProvider={dataProvider}>
            <Resource name="users" list={UserList} edit={UserEdit} />
        </Admin>
    );
};

export default AdminApp;
