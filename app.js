const express = require('express');
const multer = require('multer');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const git = simpleGit();
const REPO_DIR = path.join(__dirname, 'repo'); // Diretório temporário do repositório local

// Configuração do CORS
app.use(cors({ origin: '*' }));

// Configuração do multer para armazenar os arquivos enviados temporariamente no servidor
const upload = multer({ dest: 'uploads/' });

// Função para limpar o diretório local antes de clonar o repositório
async function limparDiretorio() {
    fs.rmSync(REPO_DIR, { recursive: true, force: true });
    fs.mkdirSync(REPO_DIR);
    console.log('Diretório local limpo e recriado.');
}

// Função para verificar se uma branch existe remotamente
async function verificaBranch(remoteUrl, branch) {
    try {
        await git.clone(remoteUrl, REPO_DIR, ['--no-checkout', '--depth', '1']);
        const gitRepo = simpleGit(REPO_DIR);
        const branchSummary = await gitRepo.branch(['-r']);

        // Verifica se a branch existe remotamente
        const branchExists = branchSummary.all.some(remoteBranch => remoteBranch.includes(`origin/${branch}`));
        if (!branchExists) {
            console.log(`Branch '${branch}' não encontrada. Criando a branch '${branch}'...`);
            await gitRepo.checkoutLocalBranch(branch);

            // Faz um commit inicial para permitir o push da nova branch
            fs.writeFileSync(path.join(REPO_DIR, 'README.md'), '# Repositório Inicial\n'); // Adiciona um arquivo para o commit
            await gitRepo.add('README.md');
            await gitRepo.commit('Commit inicial para criar a branch main');
            await gitRepo.push(['-u', 'origin', branch]); // Faz push da nova branch
        } else {
            await gitRepo.checkout(branch);
            console.log(`Branch '${branch}' ativa.`);
        }
    } catch (error) {
        console.error(`Erro ao verificar ou criar a branch: ${error.message}`);
        throw new Error(`Erro ao verificar ou criar a branch: ${error.message}`);
    }
}

// Adicionando uma rota para a raiz ("/")
app.get('/', (req, res) => {
    res.send('Bem-vindo ao backend do TaskWeb!');
});

// Rota para lidar com o upload de arquivos
app.post('/upload', upload.single('file'), async (req, res) => {
    const remoteUrl = req.body.projeto;
    const file = req.file;
    const branchName = req.body.branch; // Branch desejada
    const gitToken = process.env.GIT_TOKEN || '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';

    // Caminho do arquivo a ser movido para o diretório do repositório
    const oldPath = file.path;
    const newPath = path.join(REPO_DIR, file.originalname);

    try {
        // Limpa o diretório local
        await limparDiretorio();

        // Verifica e cria a branch remota, se necessário
        await verificaBranch(remoteUrl, branchName);

        // Inicializa o Git no diretório clonado
        const gitRepo = simpleGit(REPO_DIR);

        // Adiciona as informações do usuário ao repositório Git
        await gitRepo.addConfig('user.name', 'Patrick Olinto Duarte');
        await gitRepo.addConfig('user.email', 'olintopatrick86@gmail.com');

        // Mover o novo arquivo para o diretório do repositório
        fs.renameSync(oldPath, newPath); // Mover o arquivo
        console.log('Arquivo movido com sucesso para o diretório do repositório:', newPath);

        // Adiciona o arquivo ao repositório (sobrescrevendo se existir)
        console.log(`Adicionando o arquivo '${file.originalname}' ao repositório...`);
        await gitRepo.add(file.originalname);
        console.log('Arquivo adicionado ao Git.');

        // Faz commit do novo conteúdo
        const commitMessage = `Atualizado o arquivo ${file.originalname}`;
        await gitRepo.commit(commitMessage);
        console.log('Commit realizado com sucesso.');

        // Faz push para o repositório remoto com autenticação de token
        const remoteWithToken = `https://${gitToken}@github.com/PatrickOlintoDuarte/TesteGit_Back`;
        await gitRepo.push(remoteWithToken, branchName);
        console.log('Push realizado com sucesso.');

        res.status(200).send('Arquivo enviado e push realizado com sucesso.');
    } catch (error) {
        console.error('Erro ao realizar operações Git:', error);
        res.status(500).send('Erro ao realizar operações Git.');
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000; // Usa a porta definida pelo Railway ou 3000 como fallback
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
