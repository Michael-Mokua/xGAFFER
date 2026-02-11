import { state, getPlayerPosition, getTeamName } from '../store/state';

export const exportSquadCSV = () => {
    const { userTeam, players } = state;
    if (!userTeam.picks.length) {
        alert('No squad data to export!');
        return;
    }

    const headers = ['Player', 'Team', 'Position', 'Price', 'Total Points', 'Form', 'xEfficiency'];
    const rows = userTeam.picks.map(pick => {
        const p = players.find(player => player.id === pick.element);
        return [
            p.web_name,
            getTeamName(p.team),
            getPlayerPosition(p.element_type),
            (p.now_cost / 10).toFixed(1),
            p.total_points,
            p.form,
            p.xEfficiency
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `xGAFFER_Squad_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
