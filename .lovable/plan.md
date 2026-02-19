

## Exibir nome completo do proprietario na saudacao

**Problema atual**: O codigo em `SmartSummary.tsx` usa `.split(' ')[0]` para extrair apenas o primeiro nome do `owner_name`. Se o proprietario digitou "Elmer Diamntino", aparece apenas "Elmer".

**Solucao**: Remover o `.split(' ')[0]` e usar o valor completo de `owner_name` tal como foi digitado nas configuracoes. Assim, se a pessoa escreveu um nome, aparece um nome; se escreveu dois, aparecem dois.

**Exemplo**:
- owner_name = "Afonso" → "Bem-vindo, Afonso"
- owner_name = "Elmer Diamntino" → "Bem-vindo, Elmer Diamntino"

---

### Detalhes tecnicos

**Arquivo**: `src/components/admin/SmartSummary.tsx`

Alterar duas linhas onde `.split(' ')[0]` e usado:

- Linha 35: `ownerName = shopData.owner_name.split(' ')[0]` → `ownerName = shopData.owner_name`
- Linha 43: `ownerName = accountData?.name?.split(' ')[0] || ''` → `ownerName = accountData?.name || ''`

Nenhuma outra alteracao necessaria. O campo "Nome do Proprietario" nas configuracoes ja aceita qualquer texto, entao o utilizador controla quantos nomes aparecem.

