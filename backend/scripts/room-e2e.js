const API_BASE_URL = process.env.ROOM_E2E_BASE_URL || 'http://localhost:5000/api';
const PASSWORD = 'RoomTest123!';

const createTestUser = (prefix, stamp) => ({
  username: `${prefix}${stamp}`,
  email: `${prefix}${stamp}@test.com`,
  password: PASSWORD,
  fullName: prefix === 'roomowner' ? 'Room Owner' : 'Room Member'
});

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { message: 'Invalid JSON response' };
  }

  if (!response.ok) {
    const error = new Error(payload.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function registerUser(user) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(user)
  });
}

async function run() {
  const stamp = Date.now();
  const ownerUser = createTestUser('roomowner', stamp);
  const memberUser = createTestUser('roommember', stamp);

  let ownerToken;
  let memberToken;
  let memberId;
  let roomId;

  try {
    const ownerRegistration = await registerUser(ownerUser);
    const memberRegistration = await registerUser(memberUser);

    ownerToken = ownerRegistration.data.token;
    memberToken = memberRegistration.data.token;
    memberId = memberRegistration.data.user.id;

    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    const memberHeaders = { Authorization: `Bearer ${memberToken}` };

    const createdRoom = await request('/rooms', {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: `Room E2E ${stamp}`,
        description: 'end to end room test',
        settings: {
          isPrivate: false,
          maxMembers: 10
        }
      })
    });

    roomId = createdRoom.data._id;
    const inviteCode = createdRoom.data.inviteCode;

    const ownerRooms = await request('/rooms', { headers: ownerHeaders });
    const joinedRoom = await request('/rooms/join', {
      method: 'POST',
      headers: memberHeaders,
      body: JSON.stringify({ inviteCode })
    });
    const roomDetail = await request(`/rooms/${roomId}`, { headers: memberHeaders });
    const leaderboard = await request(`/rooms/${roomId}/leaderboard?period=weekly`, { headers: ownerHeaders });
    const ownerAnalytics = await request(`/rooms/${roomId}/analytics`, { headers: ownerHeaders });
    const promoteResult = await request(`/rooms/${roomId}/members/${memberId}/promote`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    const memberAnalytics = await request(`/rooms/${roomId}/analytics`, { headers: memberHeaders });
    const leaveResult = await request(`/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: memberHeaders
    });
    const deleteResult = await request(`/rooms/${roomId}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });

    const summary = {
      apiBaseUrl: API_BASE_URL,
      ownerUsername: ownerUser.username,
      memberUsername: memberUser.username,
      roomId,
      inviteCode,
      checks: {
        ownerRoomCount: ownerRooms.count,
        joinedMembers: joinedRoom.data.members.length,
        detailMembers: roomDetail.data.members.length,
        leaderboardEntries: Array.isArray(leaderboard.data) ? leaderboard.data.length : 0,
        ownerAnalyticsMembers: ownerAnalytics.data.totalMembers,
        promoteSuccess: promoteResult.success,
        memberAnalyticsAccess: memberAnalytics.success,
        leaveSuccess: leaveResult.success,
        deleteSuccess: deleteResult.success
      }
    };

    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    const details = {
      apiBaseUrl: API_BASE_URL,
      roomId,
      error: error.message,
      status: error.status || null,
      payload: error.payload || null
    };

    console.error(JSON.stringify(details, null, 2));
    process.exitCode = 1;
  }
}

run();