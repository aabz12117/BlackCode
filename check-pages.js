import { Octokit } from '@octokit/rest';

const octokit = new Octokit();

async function checkPages() {
    try {
        const response = await octokit.rest.repos.getPages({
            owner: 'aabz12117',
            repo: 'BlackCode'
        });

        console.log('GitHub Pages configuration:', response.data);
    } catch (error) {
        console.error('Error checking GitHub Pages:', error);
    }
}

checkPages();
