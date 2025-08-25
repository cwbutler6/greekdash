'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Play,
    Eye,
    Clock,
    FileText,
    ExternalLink,
    TrendingUp,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import {
    getVideoAnalyticsSummary,
    getAllVideoMetrics,
    getPopularVideos,
    VideoEngagementMetrics
} from '@/lib/video-analytics';
import { cn } from '@/lib/utils';

interface VideoAnalyticsDashboardProps {
    className?: string;
}

export function VideoAnalyticsDashboard({ className }: VideoAnalyticsDashboardProps) {
    const [summary, setSummary] = useState(getVideoAnalyticsSummary());
    const [allMetrics, setAllMetrics] = useState(getAllVideoMetrics());
    const [popularVideos, setPopularVideos] = useState(getPopularVideos());
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const refreshData = () => {
        setSummary(getVideoAnalyticsSummary());
        setAllMetrics(getAllVideoMetrics());
        setPopularVideos(getPopularVideos());
        setLastUpdated(new Date());
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Video Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Track engagement metrics for documentation videos
                    </p>
                </div>
                <Button onClick={refreshData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalVideos}</div>
                        <p className="text-xs text-muted-foreground">
                            Documentation videos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalViews}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all videos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.averageCompletionRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Video completion rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transcript Views</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalTranscriptViews}</div>
                        <p className="text-xs text-muted-foreground">
                            Accessibility usage
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="popular" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="popular">Popular Videos</TabsTrigger>
                    <TabsTrigger value="all">All Videos</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                </TabsList>

                <TabsContent value="popular" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                Most Popular Videos
                            </CardTitle>
                            <CardDescription>
                                Top performing videos based on views, completion rate, and engagement
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {popularVideos.length > 0 ? (
                                    popularVideos.map((video, index) => (
                                        <VideoMetricCard
                                            key={video.videoId}
                                            video={video}
                                            rank={index + 1}
                                        />
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        No video data available yet. Videos will appear here once users start watching.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Videos</CardTitle>
                            <CardDescription>
                                Complete list of all documentation videos and their metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {allMetrics.length > 0 ? (
                                    allMetrics.map((video) => (
                                        <VideoMetricCard key={video.videoId} video={video} />
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">
                                        No video data available yet.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="engagement" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Related Link Clicks</span>
                                    <Badge variant="secondary">{summary.totalRelatedLinkClicks}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Transcript Usage Rate</span>
                                    <Badge variant="secondary">
                                        {summary.totalViews > 0
                                            ? ((summary.totalTranscriptViews / summary.totalViews) * 100).toFixed(1)
                                            : 0}%
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Last Updated</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {lastUpdated.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Data refreshes automatically every 30 seconds
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Individual video metric card component
interface VideoMetricCardProps {
    video: VideoEngagementMetrics;
    rank?: number;
}

function VideoMetricCard({ video, rank }: VideoMetricCardProps) {
    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        {rank && (
                            <Badge variant="outline" className="text-xs">
                                #{rank}
                            </Badge>
                        )}
                        <h4 className="font-medium">{video.videoTitle}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Video ID: {video.videoId}
                    </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {video.totalViews} views
                </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        Views
                    </div>
                    <div className="font-medium">{video.totalViews}</div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Avg. Watch Time
                    </div>
                    <div className="font-medium">
                        {Math.floor(video.averageWatchTime / 60)}m {Math.floor(video.averageWatchTime % 60)}s
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Completion
                    </div>
                    <div className="font-medium">{video.completionRate.toFixed(1)}%</div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground">
                        <FileText className="h-3 w-3 mr-1" />
                        Transcript
                    </div>
                    <div className="font-medium">{video.transcriptViews}</div>
                </div>
            </div>

            {video.completionRate > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span>{video.completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={video.completionRate} className="h-2" />
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last watched: {video.lastWatched.toLocaleDateString()}</span>
                {video.relatedLinkClicks > 0 && (
                    <span className="flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {video.relatedLinkClicks} link clicks
                    </span>
                )}
            </div>
        </div>
    );
}