const axios = require('axios');

/**
 * GitHub API Service
 * Fetches user stats from GitHub REST & GraphQL API
 */

const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

/**
 * Fetch GitHub user statistics
 * @param {string} username - GitHub username
 * @param {string} token - GitHub personal access token (optional but recommended)
 * @returns {Object} User stats
 */
const fetchGitHubStats = async (username, token = null) => {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CodeVerse-App'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    // Fetch user profile
    const userResponse = await axios.get(`${GITHUB_API}/users/${username}`, { headers });
    const user = userResponse.data;

    // Fetch user repositories
    const reposResponse = await axios.get(`${GITHUB_API}/users/${username}/repos?per_page=100`, { headers });
    const repos = reposResponse.data;

    // Calculate stats
    const totalRepos = user.public_repos;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Fetch contribution data (requires GraphQL)
    let totalCommits = 0;
    let contributionStreak = 0;

    if (token) {
      try {
        const graphqlQuery = `
          query($username: String!) {
            user(login: $username) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                    }
                  }
                }
              }
            }
          }
        `;

        const graphqlResponse = await axios.post(
          GITHUB_GRAPHQL,
          { query: graphqlQuery, variables: { username } },
          { headers: { ...headers, 'Content-Type': 'application/json' } }
        );

        if (graphqlResponse.data?.data?.user) {
          const contribData = graphqlResponse.data.data.user.contributionsCollection.contributionCalendar;
          totalCommits = contribData.totalContributions;

          // Calculate current streak
          const days = contribData.weeks.flatMap(week => week.contributionDays).reverse();
          for (const day of days) {
            if (day.contributionCount > 0) {
              contributionStreak++;
            } else {
              break;
            }
          }
        }
      } catch (graphqlError) {
        console.warn('GitHub GraphQL query failed, using basic stats only');
      }
    }

    const stats = {
      totalRepos,
      totalStars,
      totalForks,
      totalCommits,
      contributionStreak,
      followers: user.followers,
      following: user.following,
      publicGists: user.public_gists
    };

    return {
      success: true,
      platform: 'github',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`GitHub API Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'github',
      username,
      error: error.response?.status === 404 ? 'User not found' : error.message,
      stats: null
    };
  }
};

module.exports = {
  fetchGitHubStats
};
