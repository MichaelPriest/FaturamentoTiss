import { test,expect } from '@playwright/test';
test('rota privada redireciona usuário anônimo para login',async({page})=>{await page.goto('/dashboard');await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);await expect(page.getByRole('heading',{name:/Nexo HIS/i})).toBeVisible();});
test('login valida campos obrigatórios',async({page})=>{await page.goto('/login');await page.getByRole('button',{name:'Entrar com segurança'}).click();await expect(page.getByLabel('E-mail')).toBeFocused();});
