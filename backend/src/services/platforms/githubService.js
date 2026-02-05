const axios = require('axios');

/**
 * GitHub API Service
 * Fetches ACCURATE user stats from GitHub using REST & GraphQL APIs
 */

const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

/**
 * Get years of contribution data (from account creation to now)
 */
const getContributionYears = (createdAt) => {
  const startYear = new Date(createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};

/**
 * Fetch GitHub user statistics
 * @param {string} username - GitHub username
 * @param {string} token - GitHub personal access token (optional but recommended for accurate data)
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

    // Step 1: Fetch basic user profile
    const userResponse = await axios.get(`${GITHUB_API}/users/${username}`, { headers, timeout: 10000 });
    const user = userResponse.data;

    // Step 2: Fetch all repositories (handle pagination for users with many repos)
    let repos = [];
    let page = 1;
    const perPage = 100;
    
    while (true) {
      const reposResponse = await axios.get(
        `${GITHUB_API}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
        { headers, timeout: 10000 }
      );
      
      if (reposResponse.data.length === 0) break;
      repos = repos.concat(reposResponse.data);
      
      if (reposResponse.data.length < perPage) break;
      page++;
      if (page > 3) break; // Limit to first 300 repos to avoid rate limits
    }

    // Calculate repository stats
    const totalRepos = user.public_repos;
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

    // Initialize contribution stats
    let totalCommits = 0;
    let totalPRs = 0;
    let totalIssues = 0;
    let currentYearContributions = 0;
    let contributionStreak = 0;
    let allTimeContributions = 0;

    // Step 3: Use GraphQL to get ACCURATE contribution data
    if (token) {
      try {
        console.log(`📊 Fetching accurate GitHub data for ${username} using GraphQL...`);
        
        // Get contribution years
        const years = getContributionYears(user.created_at);
        console.log(`📅 Fetching contributions from ${years.length} years (${years[years.length - 1]} - ${years[0]})`);
        
        // Fetch contributions for each year
        const yearlyData = [];
        for (const year of years) {
          const from = `${year}-01-01T00:00:00Z`;
          const to = `${year}-12-31T23:59:59Z`;
          
          const graphqlQuery = `
            query($username: String!, $from: DateTime!, $to: DateTime!) {
              user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                  totalCommitContributions
                  totalPullRequestContributions
                  totalIssueContributions
                  totalPullRequestReviewContributions
                  contributionCalendar {
                    totalContributions
                  }
                }
              }
            }
          `;

          try {
            const graphqlResponse = await axios.post(
              GITHUB_GRAPHQL,
              { 
                query: graphqlQuery, 
                variables: { username, from, to } 
              },
              { 
                headers: { 
                  ...headers, 
                  'Content-Type': 'application/json' 
                }, 
                timeout: 10000 
              }
            );

            if (graphqlResponse.data?.data?.user?.contributionsCollection) {
              const contrib = graphqlResponse.data.data.user.contributionsCollection;
              yearlyData.push({
                year,
                commits: contrib.totalCommitContributions || 0,
                prs: contrib.totalPullRequestContributions || 0,
                issues: contrib.totalIssueContributions || 0,
                reviews: contrib.totalPullRequestReviewContributions || 0,
                total: contrib.contributionCalendar.totalContributions || 0
              });
              
              console.log(`  ${year}: ${contrib.totalCommitContributions} commits, ${contrib.totalPullRequestContributions} PRs, ${contrib.totalIssueContributions} issues`);
            }
          } catch (yearError) {
            console.warn(`⚠️ Failed to fetch ${year} data:`, yearError.message);
          }
        }

        // Sum up all contributions
        totalCommits = yearlyData.reduce((sum, d) => sum + d.commits, 0);
        const yearlyPRs = yearlyData.reduce((sum, d) => sum + d.prs, 0);
        const yearlyIssues = yearlyData.reduce((sum, d) => sum + d.issues, 0);
        allTimeContributions = yearlyData.reduce((sum, d) => sum + d.total, 0);
        
        // Get current year data
        const currentYearData = yearlyData.find(d => d.year === new Date().getFullYear());
        if (currentYearData) {
          currentYearContributions = currentYearData.total;
        }

        console.log(`✅ Total contributions from GraphQL: ${totalCommits} commits, ${yearlyPRs} PRs, ${yearlyIssues} issues`);

        // Fetch all-time PR and Issue counts (more accurate than yearly sum)
        const allTimeQuery = `
          query($username: String!) {
            user(login: $username) {
              pullRequests(first: 1) {
                totalCount
              }
              issues(first: 1) {
                totalCount
              }
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

        const allTimeResponse = await axios.post(
          GITHUB_GRAPHQL,
          { query: allTimeQuery, variables: { username } },
          { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        if (allTimeResponse.data?.data?.user) {
          const userData = allTimeResponse.data.data.user;
          totalPRs = userData.pullRequests?.totalCount || yearlyPRs;
          totalIssues = userData.issues?.totalCount || yearlyIssues;
          
          // Calculate contribution streak from current year data
          const days = userData.contributionsCollection.contributionCalendar.weeks
            .flatMap(week => week.contributionDays)
            .reverse();
          
          for (const day of days) {
            if (day.contributionCount > 0) {
              contributionStreak++;
            } else if (contributionStreak > 0) {
              break; // Stop at first gap after streak started
            }
          }

          console.log(`✅ All-time totals: ${totalPRs} PRs, ${totalIssues} issues`);
          console.log(`✅ Current streak: ${contributionStreak} days`);
        }

      } catch (graphqlError) {
        console.error(`❌ GraphQL error for ${username}:`, graphqlError.response?.data || graphqlError.message);
        
        // Fallback: Use current year only
        try {
          const fallbackQuery = `
            query($username: String!) {
              user(login: $username) {
                contributionsCollection {
                  totalCommitContributions
                  totalPullRequestContributions  
                  totalIssueContributions
                  contributionCalendar {
                    totalContributions
                  }
                }
                pullRequests(first: 1) {
                  totalCount
                }
                issues(first: 1) {
                  totalCount
                }
              }
            }
          `;

          const fallbackResponse = await axios.post(
            GITHUB_GRAPHQL,
            { query: fallbackQuery, variables: { username } },
            { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 10000 }
          );

          if (fallbackResponse.data?.data?.user) {
            const userData = fallbackResponse.data.data.user;
            const contrib = userData.contributionsCollection;
            
            totalCommits = contrib.totalCommitContributions || 0;
            totalPRs = userData.pullRequests?.totalCount || 0;
            totalIssues = userData.issues?.totalCount || 0;
            currentYearContributions = contrib.contributionCalendar.totalContributions || 0;
            allTimeContributions = currentYearContributions;
            
            console.log(`⚠️ Using current year fallback: ${totalCommits} commits this year`);
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed:`, fallbackError.message);
        }
      }
    } else {
      console.warn(`⚠️ No GitHub token provided. Data will be limited to current year only.`);
      console.warn(`   Add GITHUB_TOKEN to .env for accurate all-time statistics.`);
    }

    const stats = {
      totalRepos,
      totalStars,
      totalForks,
      totalCommits, // Individual commits count
      totalPRs,
      totalIssues,
      totalContributions: allTimeContributions, // TOTAL contributions (commits + PRs + issues + reviews)
      contributionStreak,
      currentYearContributions,
      allTimeContributions, // Same as totalContributions (kept for backward compatibility)
      followers: user.followers,
      following: user.following,
      publicGists: user.public_gists,
      accountCreated: user.created_at
    };

    console.log(`\n✅ GITHUB STATS for ${username}:`);
    console.log(`   📊 Total Contributions: ${allTimeContributions} (commits: ${totalCommits}, PRs: ${totalPRs}, issues: ${totalIssues})`);
    console.log(`   📅 This year: ${currentYearContributions} contributions`);
    console.log(`   🔥 Current streak: ${contributionStreak} days`);
    console.log(`   📦 ${totalRepos} repos | ⭐ ${totalStars} stars\n`);

    return {
      success: true,
      platform: 'github',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ GitHub API Error for ${username}:`, error.message);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        platform: 'github',
        username,
        error: 'User not found. Please check the username.',
        stats: null
      };
    }
    
    if (error.response?.status === 403) {
      return {
        success: false,
        platform: 'github',
        username,
        error: 'API rate limit exceeded. Please try again later or add a GitHub token.',
        stats: null
      };
    }

    return {
      success: false,
      platform: 'github',
      username,
      error: error.message,
      stats: null
    };
  }
};

module.exports = {
  fetchGitHubStats
};
