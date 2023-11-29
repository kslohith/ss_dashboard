import React, { useEffect, useState } from 'react'
import axios from "axios"
import CircularProgress from '@mui/material/CircularProgress'
import { Box } from '@mui/material'
import { LineChart, Line } from 'recharts';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Sector, ScatterChart, Scatter } from 'recharts';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

const Dashboard = () => {
    const [sportsData,setSportsData] = useState();
    const [showLoading, setShowLoading] = useState(false);
    const [capacity, setCapacity] = useState();
    const [skillData, setSkillData] = useState();
    const [activeIndex, setActiveIndex] = useState();
    const [venues, setVenues] = useState();
    const [eventPopularity, setEventPopularity] = useState();

    useEffect(() => {
        setShowLoading(true);
        axios.get(`https://sportssync-backend.onrender.com/getAllEvents`)
        .then((response) => {
          setShowLoading(false);
          setSportsData(response.data.data);
          const result = countSports(response.data.data);
          const finalCount = Object.keys(result).map(sport => ({ name: sport, value: result[sport]}));
          const skillresult = skillCountTotal(response.data.data);
          const skillCount = Object.keys(skillresult).map(sport => ({ name: sport, value: skillresult[sport]}));
          const anotherResult = countVenues(response.data.data);
          const venueCount = Object.keys(anotherResult).map(venue => ({ name: venue, value: anotherResult[venue]}));
          const chartData = response?.data?.data?.map(event => ({
            eventName: event.sport,
            skillLevel: event.eventSkill,
            attendees: event.attendees.length,
          }));
          const popularity = EventPopularityFn(chartData);
          setEventPopularity(popularity);
          setCapacity(finalCount);
          setSkillData(skillCount);
          setVenues(venueCount);
        })
        .catch((error) => {
          setShowLoading(false);
          console.log(error);
        });
    },[]);

    const countSports = (records) => {
        const sportCounts = {};
        records.forEach(record => {
          const sportType = record.sport;
          if(sportType != undefined) {
            const normalizedSportType = sportType.toLowerCase(); 
            if (sportCounts.hasOwnProperty(normalizedSportType)) {
                sportCounts[normalizedSportType]++;
            } else {
                sportCounts[normalizedSportType] = 1;
            }
          }
        });
        return sportCounts;
      }

    const countVenues = (records) => {
        const venueCounts = {};
        records.forEach(record => {
          const venue = record.venue;
          if(venue != undefined) {
            const normalizedVenueType = venue.toLowerCase(); 
            if (venueCounts.hasOwnProperty(normalizedVenueType)) {
                venueCounts[normalizedVenueType]++;
            } else {
                venueCounts[normalizedVenueType] = 1;
            }
          }
        });
        return venueCounts;
    }

    const skillCountTotal = (records) => {
        const skillCounts = {};
        records.forEach(record => {
          const sportType = record.eventSkill;
          if(sportType != undefined) {
            if (skillCounts.hasOwnProperty(sportType)) {
                skillCounts[sportType]++;
            } else {
                skillCounts[sportType] = 1;
            }
          }
        });
        return skillCounts;
    }

    const EventPopularityFn = (records) => {
        const transformedData =  Object.values(records.reduce((result, event) => {
            const sport = event.eventName || 'Unknown'; 
            const skillLevel = event.skillLevel || 'Unknown';
            if(sport !== 'Unknown') {
                if (!result[sport]) {
                result[sport] = { eventName: sport, BeginnerSkillLevel: 0, IntermediateSkillLevel: 0, AdvancedSkillLevel: 0, AnySkillLevel: 0 };
                }
                switch (skillLevel) {
                case 'Beginner':
                    result[sport].BeginnerSkillLevel += event.attendees;
                    break;
                case 'Intermediate':
                    result[sport].IntermediateSkillLevel += event.attendees;
                    break;
                case 'Advanced':
                    result[sport].AdvancedSkillLevel += event.attendees;
                    break;
                default:
                    result[sport].AnySkillLevel += event.attendees;
                    break;
                }
            }
            return result;
          }, {}));
        return transformedData;
    }

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
      };
    return(
        <>
        {showLoading && <Box sx={{ display: 'flex' }}>
            <CircularProgress />
            </Box>
        }
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                    SportSync Data Insights
                </Typography>
            </Grid>
            <Grid item sx={7.5}>
                <p>Event Popularity By Skill Level</p>
                <Item>
                <BarChart
                    width={800}
                    height={300}
                    data={eventPopularity}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="eventName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="BeginnerSkillLevel" stackId="a" fill="#8884d8" />
                    <Bar dataKey="IntermediateSkillLevel" stackId="a" fill="#82ca9d" />
                    <Bar dataKey="AdvancedSkillLevel" stackId="a" fill="#7EB5D2" />
                    <Bar dataKey="AnySkillLevel" stackId="a" fill="#BA68C8" />
                </BarChart>
                </Item>
            </Grid>
            <Grid item sx={4.5}>
                <p>Skill Breakdown in Events</p>
                <Item>
                    <PieChart width={500} height={300}>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={skillData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                        />
                    </PieChart>
                </Item>
            </Grid>
            
            <Grid item xs={7}>
                <p>Sportwise Event Distribution</p>
                <Item>
                    <BarChart
                        width={700}
                        height={300}
                        data={capacity}
                        
                        >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke="blue" />} />
                    </BarChart>
                </Item>
            </Grid>

            <Grid item xs={4.5}>
                <p>Sportwise Venue Distribution</p>
                <Item>
                    <BarChart
                        width={400}
                        height={300}
                        data={venues}
                        
                        >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke="blue" />} />
                    </BarChart>
                </Item>
            </Grid>

           
        </Grid>
        </>
    );
}

export default Dashboard;